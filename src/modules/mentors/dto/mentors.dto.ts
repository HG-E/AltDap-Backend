import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export class CreateMentorDto {
  @IsString()
  userId!: string;

  @IsString()
  bio!: string;

  @IsArray()
  specialties!: string[];
}

export class CreateBookingDto {
  @IsString()
  scheduledStart!: string;

  @IsString()
  scheduledEnd!: string;

  @IsOptional()
  @IsString()
  guardianEmail?: string;
}

export class UpdateBookingDto {
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
