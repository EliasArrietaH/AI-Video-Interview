import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsUUID('4', { each: true }) // Valida que cada elemento del array sea un UUID v4
  skillIds: string[];
}
