import { Injectable } from '@nestjs/common';
import { CompleteChallengeDto, ProtectStreakDto, UnlockBadgeDto } from './dto/engagement.dto';

@Injectable()
export class EngagementService {
  getStreak() {
    return {
      currentValue: 14,
      longestValue: 45,
      shieldsRemaining: 1,
      lastActiveDate: new Date().toISOString(),
    };
  }

  protectStreak(payload: ProtectStreakDto) {
    return {
      status: 'protected',
      shieldId: payload.shieldId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  getDailyChallenges() {
    return {
      daily: [
        { id: 'challenge_daily_gratitude', title: 'Gratitude log', rewardPoints: 25 },
        { id: 'challenge_move', title: '10 minute walk', rewardPoints: 15 },
      ],
      weekly: [{ id: 'challenge_volunteer', title: 'Volunteer outreach', rewardPoints: 100 }],
    };
  }

  completeChallenge(challengeId: string, payload: CompleteChallengeDto) {
    return {
      challengeId,
      completedAt: new Date().toISOString(),
      rewardPoints: 25,
      reflection: payload.reflection,
    };
  }

  listBadges() {
    return {
      earned: [{ id: 'badge_first_step', name: 'First Step', earnedAt: '2024-10-01' }],
      locked: [{ id: 'badge_mentor', name: 'Mentor Match' }],
    };
  }

  unlockBadge(badgeId: string, payload: UnlockBadgeDto) {
    return {
      badgeId,
      status: 'unlocked',
      source: payload.source ?? 'system',
    };
  }
}