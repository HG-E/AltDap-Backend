import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsString()
  difficulty!: string;

  @IsNumber()
  points!: number;

  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateModuleProgressDto {
  @IsString()
  status!: 'started' | 'completed';

  @IsOptional()
  @IsNumber()
  score?: number;
}

export class CompleteCourseDto {
  @IsOptional()
  @IsString()
  reflection?: string;
}