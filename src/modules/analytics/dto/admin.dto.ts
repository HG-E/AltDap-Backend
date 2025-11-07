import { IsEnum } from 'class-validator';

export enum AccountStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export class UpdateUserStatusDto {
  @IsEnum(AccountStatus)
  status!: AccountStatus;
}