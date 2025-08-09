// import { Controller } from '@nestjs/common';

// @Controller('jobs')
// export class JobsController {}

import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { type Request } from 'express';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.jobsService.findAll();
  }
  @Get('skills')
  @UseGuards(JwtAuthGuard)
  findAllSkills() {
    return this.jobsService.findAllSkills();
  }
  @Post()
  @UseGuards(JwtAuthGuard)
  createJob(@Body() createJobDto: CreateJobDto, @Req() req: Request) {
    return this.jobsService.createJob(createJobDto, req.user as any);
  }

  @Post('skills')
  createSkill(@Body() createSkillDto: CreateSkillDto) {
    return this.jobsService.createSkill(createSkillDto);
  }
}
