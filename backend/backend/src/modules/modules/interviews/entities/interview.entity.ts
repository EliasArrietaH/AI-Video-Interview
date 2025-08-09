import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Job } from '../../jobs/entities/job.entity';
import { InterviewStatus } from '../../../../common/enums/interview-status.enum';
import { InterviewTurn } from './interview-turn.entity';

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => InterviewTurn, (turn) => turn.interview)
  turns: InterviewTurn[];

  @ManyToOne(() => User, (user) => user.interviews)
  @JoinColumn({ name: 'talent_id' })
  talent: User;

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({
    type: 'enum',
    enum: InterviewStatus,
    default: InterviewStatus.PENDING,
  })
  status: InterviewStatus;

  @Column('text', { nullable: true })
  full_transcript: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  final_score: number;

  @Column({ nullable: true })
  video_url: string;
}
