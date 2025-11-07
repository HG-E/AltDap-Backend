import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CompleteChallengeDto, ProtectStreakDto, UnlockBadgeDto } from './dto/engagement.dto';

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getStreak(userId: string) {
    const streak = await this.prisma.streak.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    return {
      currentValue: streak.currentValue,
      longestValue: streak.longestValue,
      shieldsRemaining: streak.shieldsRemaining,
      lastActiveDate: streak.lastActiveDate ? streak.lastActiveDate.toISOString() : null,
    };
  }

  async protectStreak(userId: string, payload: ProtectStreakDto) {
    const streak = await this.prisma.streak.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    if (streak.shieldsRemaining <= 0) {
      throw new BadRequestException('No streak shields remaining');
    }

    const updated = await this.prisma.streak.update({
      where: { userId },
      data: {
        shieldsRemaining: streak.shieldsRemaining - 1,
        lastActiveDate: new Date(),
      },
    });

    return {
      status: 'protected',
      shieldId: payload.shieldId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      shieldsRemaining: updated.shieldsRemaining,
    };
  }

  async getDailyChallenges() {
    const challenges = await this.prisma.challenge.findMany({
      orderBy: { rewardPoints: 'desc' },
    });

    const daily = [] as Array<Record<string, unknown>>;
    const weekly = [] as Array<Record<string, unknown>>;

    for (const challenge of challenges) {
      const entry = {
        id: challenge.id,
        title: challenge.title,
        rewardPoints: challenge.rewardPoints,
        expiresAt: challenge.expiresAt ? challenge.expiresAt.toISOString() : null,
      };
      const type = challenge.type.toLowerCase();
      if (type === 'daily') {
        daily.push(entry);
      } else if (type === 'weekly') {
        weekly.push(entry);
      }
    }

    return { daily, weekly };
  }

  async completeChallenge(userId: string, challengeId: string, payload: CompleteChallengeDto) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true, rewardPoints: true },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const completion = await this.prisma.challengeCompletion.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: { completedAt: new Date() },
      create: { userId, challengeId },
    });

    return {
      challengeId,
      completedAt: completion.completedAt.toISOString(),
      rewardPoints: challenge.rewardPoints,
      reflection: payload.reflection ?? null,
    };
  }

  async listBadges(userId: string) {
    const [badges, earned] = await this.prisma.$transaction([
      this.prisma.badge.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
      }),
    ]);

    const earnedSet = new Set(earned.map((entry) => entry.badgeId));

    const earnedBadges = earned.map((entry) => ({
      id: entry.badge.id,
      code: entry.badge.code,
      name: entry.badge.name,
      icon: entry.badge.icon,
      earnedAt: entry.earnedAt.toISOString(),
    }));

    const lockedBadges = badges
      .filter((badge) => !earnedSet.has(badge.id))
      .map((badge) => ({ id: badge.id, code: badge.code, name: badge.name, icon: badge.icon }));

    return {
      earned: earnedBadges,
      locked: lockedBadges,
    };
  }

  async unlockBadge(userId: string, badgeId: string, payload: UnlockBadgeDto) {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException('Badge not found');
    }

    const userBadge = await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId } },
      update: { earnedAt: new Date() },
      create: { userId, badgeId },
    });

    return {
      badgeId,
      status: 'unlocked',
      source: payload.source ?? 'system',
      earnedAt: userBadge.earnedAt.toISOString(),
    };
  }

}
