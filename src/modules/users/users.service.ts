import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto, UploadAvatarDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  getMe(userId = 'demo-user') {
    return {
      id: userId,
      firstName: 'Demo',
      lastName: 'User',
      pronouns: 'they/them',
      goals: ['build routines', 'earn scholarships'],
    };
  }

  updateMe(payload: UpdateProfileDto) {
    return { ...this.getMe(), ...payload };
  }

  async requestAvatarUpload(payload: UploadAvatarDto) {
    return {
      uploadUrl: `https://uploads.altdap.example/${payload.filename}`,
      mimeType: payload.mimeType,
      expiresIn: 300,
    };
  }

  getPublicProfile(id: string) {
    return {
      id,
      firstName: 'Community',
      lastName: 'Member',
      badges: 5,
    };
  }

  getSettings(userId = 'demo-user') {
    return {
      userId,
      notificationChannel: 'push',
      guardianEmail: 'guardian@example.com',
      privacyLevel: 'friends',
    };
  }

  updateSettings(payload: UpdateSettingsDto) {
    return { ...this.getSettings(), ...payload };
  }
}