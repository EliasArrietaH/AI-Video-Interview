import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

@Injectable()
export class DeepgramService {
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('DEEPGRAM_API_KEY');
    if (!key) {
      throw new Error('DEEPGRAM_API_KEY no está definida en el archivo .env');
    }
    this.apiKey = key;
  }

  createLiveSocket(onTranscript: (text: string) => void): {
    socket: WebSocket;
    cleanup: () => void;
  } {
    console.log('🚀 [Deepgram] Creando conexión WebSocket...');

    const url =
      'wss://api.deepgram.com/v1/listen?' +
      new URLSearchParams({
        punctuate: 'true',
        language: 'es',
        encoding: 'linear16',
        sample_rate: '16000',
        channels: '1',
        interim_results: 'true',
        smart_format: 'true',
        endpointing: '500',
        vad_events: 'true',
      }).toString();

    const deepgramSocket = new WebSocket(url, {
      headers: { Authorization: `Token ${this.apiKey}` },
    });

    let keepAliveInterval: NodeJS.Timeout;

    deepgramSocket.on('open', () => {
      console.log('✅ [Deepgram] Socket conectado');
      const keepAliveMessage = JSON.stringify({ type: 'KeepAlive' });

      keepAliveInterval = setInterval(() => {
        if (deepgramSocket.readyState === WebSocket.OPEN) {
          deepgramSocket.send(keepAliveMessage);
          console.log('💓 [Deepgram] Keep-alive enviado');
        }
      }, 5000);
    });

    deepgramSocket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.channel?.alternatives?.[0]?.transcript) {
          const transcript = data.channel.alternatives[0].transcript;
          if (transcript.trim().length > 0) {
            onTranscript(transcript);
          }
        }
      } catch (error) {
        console.error('❌ [Deepgram] Error procesando mensaje:', error);
      }
    });

    deepgramSocket.on('error', (err) => {
      console.error('❌ [Deepgram] Error de socket:', err);
    });

    deepgramSocket.on('close', (code, reason) => {
      console.log(`🔌 [Deepgram] Cerrado - ${code}: ${reason.toString()}`);
    });

    const cleanup = () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
        console.log('🧹 [Deepgram] Intervalo Keep-alive detenido.');
      }
      if (deepgramSocket && deepgramSocket.readyState === WebSocket.OPEN) {
        deepgramSocket.close();
      }
    };

    return { socket: deepgramSocket, cleanup };
  }
}
