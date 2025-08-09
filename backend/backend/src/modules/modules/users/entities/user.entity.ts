import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserRole } from '../../../../common/enums/user-role.enum';
import { Job } from '../../jobs/entities/job.entity';
import { Interview } from '../../interviews/entities/interview.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  // --- CORRECCIÓN: Se eliminó forwardRef() ---
  @OneToMany(() => Job, (job) => job.posted_by)
  posted_jobs: Job[];

  // --- CORRECCIÓN: Se eliminó forwardRef() ---
  @OneToMany(() => Interview, (interview) => interview.talent)
  interviews: Interview[];
}
