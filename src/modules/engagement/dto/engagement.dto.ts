import { IsOptional, IsString } from 'class-validator';

export class ProtectStreakDto {
  @IsString()
  shieldId!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CompleteChallengeDto {
  @IsOptional()
  @IsString()
  reflection?: string;
}

export class UnlockBadgeDto {
  @IsOptional()
  @IsString()
  source?: string;
}