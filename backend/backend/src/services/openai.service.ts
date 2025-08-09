import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateQuestion(skills: string[]): Promise<string> {
    this.logger.log(
      `Generando pregunta para las habilidades: ${skills.join(', ')}`,
    );
    const prompt = `Actúa como un entrevistador técnico senior.
      Formula una pregunta de entrevista concisa y abierta para evaluar la experiencia de un candidato en las siguientes tecnologías: ${skills.join(
        ', ',
      )}.
      La pregunta debe permitir al candidato demostrar sus conocimientos prácticos.
      No saludes ni añadas texto introductorio, solo devuelve la pregunta.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      });

      const question = completion.choices[0]?.message?.content;
      if (!question) {
        this.logger.error(
          'OpenAI devolvió una respuesta vacía al generar la pregunta.',
        );
        throw new Error('No se pudo obtener una pregunta válida de la IA.');
      }
      // ===========================

      this.logger.log(`Pregunta generada: "${question.trim()}"`);
      return question.trim();
    } catch (error) {
      this.logger.error('Error al generar la pregunta con OpenAI', error);
      throw new Error('No se pudo generar la pregunta.');
    }
  }

  async evaluateAnswer(question: string, answer: string): Promise<number> {
    this.logger.log(`Evaluando respuesta para la pregunta: "${question}"`);
    const prompt = `Como un evaluador técnico experto, analiza la siguiente interacción y califícala del 0 al 100.
      Considera la precisión técnica, la claridad de la explicación y la profundidad del conocimiento.

      Pregunta realizada: "${question}"
      Respuesta del candidato: "${answer}"

      Basado en la calidad de la respuesta, proporciona una puntuación numérica entre 0 y 100.
      Responde única y exclusivamente con el número de la calificación. No incluyas explicaciones, contexto ni texto adicional. Tu única respuesta debe ser el número.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: prompt }],
        temperature: 0.2,
        max_tokens: 5,
      });

      const scoreText = completion.choices[0]?.message?.content;
      if (!scoreText) {
        this.logger.error(
          'OpenAI devolvió una respuesta vacía al evaluar la respuesta.',
        );
        throw new Error('No se pudo obtener una calificación válida de la IA.');
      }

      const score = parseInt(scoreText.trim(), 10);

      if (isNaN(score) || score < 0 || score > 100) {
        this.logger.warn(
          `OpenAI devolvió una puntuación inválida: "${scoreText}"`,
        );
        throw new Error('Puntuación inválida generada por la IA.');
      }

      this.logger.log(`Respuesta calificada con: ${score}`);
      return score;
    } catch (error) {
      this.logger.error('Error al evaluar la respuesta con OpenAI', error);
      throw new Error('No se pudo evaluar la respuesta.');
    }
  }
}
