import { IsNotEmpty, IsUUID } from 'class-validator';

export class StartInterviewDto {
  @IsUUID('4')
  @IsNotEmpty()
  jobId: string;
}
