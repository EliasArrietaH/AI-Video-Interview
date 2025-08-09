import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { Skill } from './entities/skill.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Skill])], //Entidades
  controllers: [JobsController],
  providers: [JobsService],
  exports: [TypeOrmModule],
})
export class JobsModule {}
