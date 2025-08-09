import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DailyService } from 'src/services/daily.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InterviewsService } from './interviews.service';
import { StartInterviewDto } from './dto/start-interview.dto';
import { type Request } from 'express';

@Controller('interviews')
export class InterviewsController {
  constructor(
    private readonly dailyService: DailyService,
    private readonly interviewsService: InterviewsService, // Inyecta el servicio
  ) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard) // Protegemos el endpoint
  findOne(@Param('id') id: string) {
    return this.interviewsService.findOne(id);
  }
  /**
   * Endpoint para que un talento inicie el proceso de una entrevista.
   * Crea el registro en la BD y genera la primera pregunta.
   */
  @Post('start')
  @UseGuards(JwtAuthGuard)
  async startInterview(
    @Body() startInterviewDto: StartInterviewDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;
    return this.interviewsService.start(startInterviewDto, user);
  }

  /**
   * Endpoint para crear una sala de videollamada en Daily.co.
   */
  @Post('create-room')
  async createRoom() {
    const roomUrl = await this.dailyService.createRoom();
    return { url: roomUrl };
  }
}
