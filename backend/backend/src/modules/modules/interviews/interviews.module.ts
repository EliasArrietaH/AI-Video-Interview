// import { Module } from '@nestjs/common';
// import { InterviewsController } from './interviews.controller';
// import { InterviewsService } from './interviews.service';

// @Module({
//   controllers: [InterviewsController],
//   providers: [InterviewsService],
// })
// export class InterviewsModule {}
import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { ServicesModule } from 'src/modules/services/services.module';
import { TypeOrmModule } from '@nestjs/typeorm'; // <-- 1. Importa TypeOrmModule
import { Interview } from './entities/interview.entity'; // <-- 2. Importa la entidad Interview
import { JobsModule } from '../jobs/jobs.module';
import { InterviewTurn } from './entities/interview-turn.entity';

@Module({
  imports: [
    ServicesModule,
    TypeOrmModule.forFeature([Interview, InterviewTurn]),
    JobsModule,
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService],
})
export class InterviewsModule {}
