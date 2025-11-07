import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReactionType {
  Like = 'like',
  Support = 'support',
  Celebrate = 'celebrate',
}

export class CreatePostDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsArray()
  mediaUrls?: string[];
}

export class CreateReactionDto {
  @IsEnum(ReactionType)
  type!: ReactionType;
}

export class ReportPostDto {
  @IsString()
  reason!: string;
}

export class CreateCommentDto {
  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

export class ModerationReviewDto {
  @IsString()
  targetId!: string;

  @IsString()
  decision!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
