import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User, UserRole as PrismaUserRole, ConsentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { sign, type SignOptions } from 'jsonwebtoken';
import ms from 'ms';
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

type SessionMetadata = {
  userAgent?: string;
  ipAddress?: string;
};

type TokenBundle = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  private static readonly PASSWORD_SALT_ROUNDS = 11;

  constructor(private readonly prisma: PrismaService, private readonly configService: ConfigService) {}

  async signup(payload: SignupDto, metadata: SessionMetadata) {
    const email = payload.email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(payload.password, AuthService.PASSWORD_SALT_ROUNDS);
    const userRole = this.mapRole(payload.role);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: userRole,
        firstName: payload.firstName,
        lastName: payload.lastName,
        guardianEmail: payload.guardianEmail,
      },
    });

    const tokens = await this.issueTokens(user, metadata);
    return { user: this.presentUser(user), tokens };
  }

  async login(payload: LoginDto, metadata: SessionMetadata) {
    const email = payload.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user, metadata);
    return { user: this.presentUser(user), tokens };
  }

  async refresh(payload: RefreshTokenDto, metadata: SessionMetadata) {
    const session = await this.validateRefreshToken(payload.refreshToken);
    await this.prisma.session.delete({ where: { id: session.id } });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    const tokens = await this.issueTokens(user, metadata);
    return { user: this.presentUser(user), tokens };
  }

  async logout(payload: LogoutDto) {
    const session = await this.findSessionByToken(payload.refreshToken);
    if (session) {
      await this.prisma.session.delete({ where: { id: session.id } });
    }

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
    const consent = await this.prisma.guardianConsent.upsert({
      where: { userId: payload.teenUserId },
      update: {
        guardianName: payload.guardianName,
        guardianEmail: payload.guardianEmail,
        status: ConsentStatus.APPROVED,
        signedAt: new Date(),
      },
      create: {
        userId: payload.teenUserId,
        guardianName: payload.guardianName,
        guardianEmail: payload.guardianEmail,
        status: ConsentStatus.APPROVED,
        signedAt: new Date(),
      },
    });

    await this.prisma.user.update({
      where: { id: payload.teenUserId },
      data: {
        guardianEmail: payload.guardianEmail,
        guardianConsentStatus: ConsentStatus.APPROVED,
      },
    });

    return { status: consent.status, signedAt: consent.signedAt, guardian: consent.guardianName };
  }

  private presentUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    };
  }

  private async issueTokens(user: User, metadata: SessionMetadata): Promise<TokenBundle> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.generateRefreshToken();
    const refreshExpiresAt = this.computeRefreshExpiry();

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenLifetimeSeconds(),
      refreshExpiresAt,
    };
  }

  private signAccessToken(user: User): string {
    const secret = this.configService.get<string>('app.jwt.accessSecret');
    if (!secret) {
      throw new Error('JWT access secret not configured');
    }

    const expiresIn = (this.configService.get<string>('app.jwt.accessExpiresIn') ?? '15m') as ms.StringValue;
    const options: SignOptions = { expiresIn };

    return sign({ sub: user.id, role: user.role, email: user.email }, secret, options);
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private computeRefreshExpiry(): Date {
    const ttl = this.configService.get<string>('app.jwt.refreshExpiresIn') ?? '7d';
    const expiresInMs = this.durationMs(ttl);
    return new Date(Date.now() + expiresInMs);
  }

  private accessTokenLifetimeSeconds(): number {
    const ttl = this.configService.get<string>('app.jwt.accessExpiresIn') ?? '15m';
    return Math.floor(this.durationMs(ttl) / 1000);
  }

  private durationMs(ttl: string): number {
    const duration = ms(ttl as ms.StringValue);
    if (typeof duration !== 'number') {
      throw new Error(`Invalid duration string: ${ttl}`);
    }
    return duration;
  }

  private async validateRefreshToken(refreshToken: string) {
    const session = await this.findSessionByToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return session;
  }

  private async findSessionByToken(refreshToken: string) {
    const hashed = this.hashToken(refreshToken);
    return this.prisma.session.findFirst({ where: { refreshTokenHash: hashed } });
  }

  private mapRole(role: SignupDto['role']): PrismaUserRole {
    const mapping: Record<SignupDto['role'], PrismaUserRole> = {
      teen: PrismaUserRole.TEEN,
      guardian: PrismaUserRole.GUARDIAN,
      mentor: PrismaUserRole.MENTOR,
      admin: PrismaUserRole.ADMIN,
    };

    return mapping[role];
  }
}
