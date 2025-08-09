import { Module } from '@nestjs/common';
import { DailyService } from 'src/services/daily.service';
import { DeepgramService } from 'src/services/deepgram.service';
import { OpenaiService } from 'src/services/openai.service';

@Module({
  providers: [DailyService, DeepgramService, OpenaiService],
  exports: [DailyService, DeepgramService, OpenaiService],
})
export class ServicesModule {}
