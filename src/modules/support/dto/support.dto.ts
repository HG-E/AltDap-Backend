import { IsOptional, IsString } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateSupportMessageDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  attachment?: string;
}