import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interview } from './entities/interview.entity';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { StartInterviewDto } from './dto/start-interview.dto';

import { InterviewStatus } from 'src/common/enums/interview-status.enum';
import { InterviewTurn } from './entities/interview-turn.entity';
import { OpenaiService } from 'src/services/openai.service';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: string;
};

@Injectable()
export class InterviewsService {
  constructor(
    @InjectRepository(Interview)
    private readonly interviewRepository: Repository<Interview>,
    @InjectRepository(InterviewTurn)
    private readonly turnRepository: Repository<InterviewTurn>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly openaiService: OpenaiService,
  ) {}

  async start(
    startInterviewDto: StartInterviewDto,
    user: AuthenticatedUser,
  ): Promise<{
    interviewId: string;
    firstQuestion: string;
    jobSkills: string[];
  }> {
    const { jobId } = startInterviewDto;

    const job = await this.jobRepository.findOne({
      where: { id: jobId },
      relations: ['skills'],
    });

    if (!job) {
      throw new NotFoundException(
        `El trabajo con ID "${jobId}" no fue encontrado.`,
      );
    }

    const newInterview = this.interviewRepository.create({
      job: { id: jobId },
      talent: { id: user.userId },
      status: InterviewStatus.IN_PROGRESS,
    });
    await this.interviewRepository.save(newInterview);

    const skillNames = job.skills.map((skill) => skill.name);
    const firstQuestion = await this.openaiService.generateQuestion(skillNames);

    return {
      interviewId: newInterview.id,
      firstQuestion,
      jobSkills: skillNames, // Devolvemos las skills para el gateway
    };
  }

  async saveTurn(
    interviewId: string,
    question: string,
    answer: string,
    score: number,
  ): Promise<InterviewTurn> {
    const turn = this.turnRepository.create({
      interview: { id: interviewId },
      question_text: question,
      answer_transcript: answer,
      score,
    });
    return this.turnRepository.save(turn);
  }

  async finish(interviewId: string): Promise<Interview> {
    const interview = await this.interviewRepository.findOne({
      where: { id: interviewId },
      relations: ['turns'],
    });

    if (!interview || interview.turns.length === 0) {
      throw new NotFoundException(
        `No se encontraron turnos para la entrevista ${interviewId}`,
      );
    }

    const totalScore = interview.turns.reduce(
      (sum, turn) => sum + Number(turn.score),
      0,
    );
    const finalScore = totalScore / interview.turns.length;

    interview.status = InterviewStatus.COMPLETED;
    interview.final_score = finalScore;

    return this.interviewRepository.save(interview);
  }

  async findOne(id: string): Promise<Interview> {
    const interview = await this.interviewRepository.findOne({
      where: { id },
      relations: ['job', 'job.skills', 'turns'],
    });
    if (!interview) {
      throw new NotFoundException(`Entrevista con ID "${id}" no encontrada.`);
    }
    return interview;
  }
}
