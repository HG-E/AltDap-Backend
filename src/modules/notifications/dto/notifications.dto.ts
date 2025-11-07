import { IsArray, IsOptional, IsString } from 'class-validator';

export class MarkNotificationsReadDto {
  @IsArray()
  ids!: string[];
}

export class SubscribeDeviceDto {
  @IsString()
  deviceId!: string;

  @IsString()
  platform!: string;

  @IsString()
  token!: string;

  @IsOptional()
  @IsString()
  locale?: string;
}