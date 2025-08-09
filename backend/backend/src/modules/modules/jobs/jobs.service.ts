import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { Skill } from './entities/skill.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { CreateSkillDto } from './dto/create-skill.dto';

type AuthenticatedUser = {
  userId: string;
  email: string;
  role: string;
};

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
  ) {}
  async findAllSkills(): Promise<Skill[]> {
    return this.skillRepository.find();
  }
  async findAll(): Promise<Job[]> {
    return this.jobRepository.find({ relations: ['skills'] });
  }
  async createSkill(createSkillDto: CreateSkillDto): Promise<Skill> {
    const { name } = createSkillDto;
    const existingSkill = await this.skillRepository.findOneBy({ name });
    if (existingSkill) {
      throw new ConflictException(`La habilidad "${name}" ya existe.`);
    }
    const skill = this.skillRepository.create({ name });
    return this.skillRepository.save(skill);
  }

  async createJob(
    createJobDto: CreateJobDto,
    user: AuthenticatedUser,
  ): Promise<Job> {
    const { title, description, skillIds } = createJobDto;

    const skills = await this.skillRepository
      .createQueryBuilder('skill')
      .where('skill.id IN (:...skillIds)', { skillIds })
      .getMany();

    if (skills.length !== skillIds.length) {
      throw new BadRequestException(
        'Uno o más IDs de habilidad no son válidos.',
      );
    }

    const job = this.jobRepository.create({
      title,
      description,
      skills,

      posted_by: { id: user.userId },
    });

    return this.jobRepository.save(job);
  }
}
