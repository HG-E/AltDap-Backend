import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  GuardianConsentDto,
  LoginDto,
  LogoutDto,
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
  RefreshTokenDto,
  SignupDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(payload: SignupDto) {
    const userId = randomBytes(6).toString('hex');
    return {
      user: {
        id: userId,
        email: payload.email,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      tokens: this.generateTokens(userId),
    };
  }

  async login(payload: LoginDto) {
    const userId = randomBytes(6).toString('hex');
    return {
      user: { id: userId, email: payload.email, role: 'teen' },
      tokens: this.generateTokens(userId),
    };
  }

  async refresh(payload: RefreshTokenDto) {
    return this.generateTokens('user-from-refresh');
  }

  async logout(_payload: LogoutDto) {
    return { success: true };
  }

  async requestPasswordReset(payload: PasswordResetRequestDto) {
    return { success: true, destination: payload.email };
  }

  async confirmPasswordReset(_payload: PasswordResetConfirmDto) {
    return { success: true };
  }

  async verifyEmail(_payload: VerifyEmailDto) {
    return { success: true };
  }

  async guardianConsent(payload: GuardianConsentDto) {
    return { status: 'approved', guardian: payload.guardianName, teenUserId: payload.teenUserId };
  }

  private generateTokens(userId: string) {
    return {
      accessToken: `access-${userId}-${randomBytes(4).toString('hex')}`,
      refreshToken: `refresh-${userId}-${randomBytes(4).toString('hex')}`,
      expiresIn: 900,
    };
  }
}