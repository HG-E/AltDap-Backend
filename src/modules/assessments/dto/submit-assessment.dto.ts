import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitAssessmentDto {
  @IsString()
  versionId!: string;

  @IsArray()
  answers!: Array<{ questionId: string; value: string }>;

  @IsOptional()
  @IsArray()
  tags?: string[];
}