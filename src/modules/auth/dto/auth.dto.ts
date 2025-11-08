import { ArrayNotEmpty, IsArray, IsEmail, IsEnum, IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserRole {
  Teen = 'teen',
  Guardian = 'guardian',
  Mentor = 'mentor',
  Admin = 'admin',
}

export class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsString()
  guardianEmail?: string;

  @IsOptional()
  @IsInt()
  age?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class LogoutDto {
  @IsString()
  refreshToken!: string;
}

export class PasswordResetRequestDto {
  @IsEmail()
  email!: string;
}

export class PasswordResetConfirmDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class GuardianConsentDto {
  @IsString()
  teenUserId!: string;

  @IsString()
  guardianName!: string;

  @IsEmail()
  guardianEmail!: string;

  @IsString()
  approvalCode!: string;
}
