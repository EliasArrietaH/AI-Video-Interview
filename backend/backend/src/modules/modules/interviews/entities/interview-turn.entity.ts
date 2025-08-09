import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Interview } from './interview.entity';

@Entity('interview_turns')
export class InterviewTurn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Muchos turnos pertenecen a una entrevista
  @ManyToOne(() => Interview, (interview) => interview.turns)
  @JoinColumn({ name: 'interview_id' })
  interview: Interview;

  @Column('text')
  question_text: string;

  @Column('text')
  answer_transcript: string;

  @Column('decimal', { precision: 5, scale: 2 })
  score: number;
}
