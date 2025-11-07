import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { UpdateProfileDto, UpdateSettingsDto, UploadAvatarDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  private readonly profileSelect: Prisma.UserSelect = {
    id: true,
    email: true,
    role: true,
    firstName: true,
    lastName: true,
    pronouns: true,
    bio: true,
    avatarUrl: true,
    guardianEmail: true,
    guardianConsentStatus: true,
    settings: true,
  };

  constructor(private readonly prisma: PrismaService) {}

  getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: this.profileSelect,
    });
  }

  async updateMe(userId: string, payload: UpdateProfileDto) {
    const { goals, ...profile } = payload;

    const currentSettings = await this.fetchSettings(userId);
    const settingsPatch: Record<string, unknown> = {};
    if (goals) {
      settingsPatch.goals = goals;
    }

    const data: Prisma.UserUpdateInput = {
      ...profile,
    };

    if (Object.keys(settingsPatch).length > 0) {
      data.settings = { ...currentSettings, ...settingsPatch };
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: this.profileSelect,
    });
  }

  async requestAvatarUpload(userId: string, payload: UploadAvatarDto) {
    const storageKey = `avatars/${userId}/${Date.now()}-${payload.filename}`;
    const cdnUrl = `https://cdn.altdap.local/${storageKey}`;

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: cdnUrl },
    });

    return {
      uploadUrl: `https://uploads.altdap.local/${storageKey}`,
      mimeType: payload.mimeType,
      expiresIn: 300,
      avatarUrl: cdnUrl,
    };
  }

  async getPublicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pronouns: true,
        bio: true,
        avatarUrl: true,
        mentorProfile: {
          select: {
            bio: true,
            specialties: true,
          },
        },
        userBadges: {
          select: {
            earnedAt: true,
            badge: {
              select: { id: true, code: true, name: true, icon: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      pronouns: user.pronouns,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      mentorProfile: user.mentorProfile,
      badges: user.userBadges.map((entry) => ({
        id: entry.badge.id,
        code: entry.badge.code,
        name: entry.badge.name,
        icon: entry.badge.icon,
        earnedAt: entry.earnedAt,
      })),
    };
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { guardianEmail: true, settings: true },
    });

    const settings = this.parseSettings(user.settings);
    return {
      userId,
      guardianEmail: user.guardianEmail,
      notificationChannel: settings.notificationChannel ?? 'push',
      privacyLevel: settings.privacyLevel ?? 'friends',
      goals: settings.goals ?? [],
    };
  }

  async updateSettings(userId: string, payload: UpdateSettingsDto) {
    const currentSettings = await this.fetchSettings(userId);
    const nextSettings = { ...currentSettings };
    let settingsChanged = false;

    if (payload.notificationChannel !== undefined) {
      nextSettings.notificationChannel = payload.notificationChannel;
      settingsChanged = true;
    }
    if (payload.privacyLevel !== undefined) {
      nextSettings.privacyLevel = payload.privacyLevel;
      settingsChanged = true;
    }

    const data: Prisma.UserUpdateInput = {};

    if (payload.guardianEmail !== undefined) {
      data.guardianEmail = payload.guardianEmail;
    }

    if (settingsChanged) {
      data.settings = nextSettings;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.getSettings(userId);
  }

  private async fetchSettings(userId: string) {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { settings: true },
    });
    return this.parseSettings(record.settings);
  }

  private parseSettings(settings: Prisma.JsonValue | null | undefined): Record<string, any> {
    if (!settings || typeof settings !== 'object') {
      return {};
    }
    return settings as Record<string, any>;
  }
}
