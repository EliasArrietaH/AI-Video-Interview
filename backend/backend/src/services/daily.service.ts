import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class DailyService {
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.daily.co/v1/rooms';

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('DAILY_API_KEY');
    if (!key) {
      throw new Error('DAILY_API_KEY no está definida en el archivo .env');
    }
    this.apiKey = key;
  }

  async createRoom(): Promise<string> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          properties: {
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
            enable_chat: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      return response.data.url;
    } catch (error: any) {
      console.error(
        'Error creating Daily room:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to create Daily room');
    }
  }
}
