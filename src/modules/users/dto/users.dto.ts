import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  pronouns?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  goals?: string[];
}

export class UploadAvatarDto {
  @IsString()
  filename!: string;

  @IsString()
  mimeType!: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  notificationChannel?: string;

  @IsOptional()
  @IsString()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  privacyLevel?: string;
}