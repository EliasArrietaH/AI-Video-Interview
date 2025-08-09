import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

import { InterviewsService } from '../interviews/interviews.service';
import WebSocket from 'ws';
import { OpenaiService } from 'src/services/openai.service';
import { DeepgramService } from 'src/services/deepgram.service';

// Estructura para gestionar el estado de cada entrevista activa
interface InterviewState {
  interviewId: string;
  jobSkills: string[];
  currentQuestion: string;
  turnCount: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private deepgramConnections = new Map<
    string,
    { socket: WebSocket; cleanup: () => void }
  >();
  private activeInterviews = new Map<string, InterviewState>();

  constructor(
    private readonly deepgramService: DeepgramService,
    private readonly openaiService: OpenaiService,
    private readonly interviewsService: InterviewsService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`🔌 Cliente conectado: ${client.id}`);
    client.emit('connected', '¡Bienvenido!');
  }

  @SubscribeMessage('start_interview_session')
  async handleStartSession(
    @MessageBody()
    data: { interviewId: string; firstQuestion: string; jobSkills: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Iniciando sesión para entrevista: ${data.interviewId}`);
    this.activeInterviews.set(client.id, {
      interviewId: data.interviewId,
      currentQuestion: data.firstQuestion,
      jobSkills: data.jobSkills || [],
      turnCount: 1,
    });

    this.initializeDeepgram(client.id);
  }

  @SubscribeMessage('audio_chunk')
  handleAudioChunk(
    @MessageBody() buffer: ArrayBuffer,
    @ConnectedSocket() client: Socket,
  ) {
    const connection = this.deepgramConnections.get(client.id);
    if (connection) {
      // Luego, en un bloque anidado, verificamos que el socket esté abierto.
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.send(buffer);
      }
    }
  }

  @SubscribeMessage('user_finished_speaking')
  async handleUserFinished(
    @MessageBody() data: { fullAnswer: string },
    @ConnectedSocket() client: Socket,
  ) {
    const state = this.activeInterviews.get(client.id);
    if (!state) return;

    this.logger.log(
      `Respuesta recibida para pregunta: "${state.currentQuestion}"`,
    );
    this.server.to(client.id).emit('evaluating_answer');

    const score = await this.openaiService.evaluateAnswer(
      state.currentQuestion,
      data.fullAnswer,
    );
    await this.interviewsService.saveTurn(
      state.interviewId,
      state.currentQuestion,
      data.fullAnswer,
      score,
    );

    if (state.turnCount >= 3) {
      this.logger.log(`Entrevista ${state.interviewId} finalizada.`);
      const finalResult = await this.interviewsService.finish(
        state.interviewId,
      );

      this.server.to(client.id).emit('interview_finished', {
        message: '¡Gracias! La entrevista ha concluido.',
        result: finalResult,
      });

      this.cleanupDeepgram(client.id);
      this.activeInterviews.delete(client.id);
      return;
    }

    this.server.to(client.id).emit('generating_next_question');
    const nextQuestion = await this.openaiService.generateQuestion(
      state.jobSkills,
    );

    state.currentQuestion = nextQuestion;
    state.turnCount++;
    this.activeInterviews.set(client.id, state);

    this.server.to(client.id).emit('new_question', { question: nextQuestion });
  }

  private initializeDeepgram(clientId: string) {
    const { socket, cleanup } = this.deepgramService.createLiveSocket(
      (transcript: string) => {
        this.server.to(clientId).emit('transcript', transcript);
      },
    );
    this.deepgramConnections.set(clientId, { socket, cleanup });
  }

  private cleanupDeepgram(clientId: string) {
    const connection = this.deepgramConnections.get(clientId);
    if (connection) {
      connection.cleanup();
      this.deepgramConnections.delete(clientId);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`👋 Cliente desconectado: ${client.id}`);
    this.cleanupDeepgram(client.id);
    this.activeInterviews.delete(client.id);
  }
}
