import { Module } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { StreaksController } from './streaks.controller';
import { ChallengesController } from './challenges.controller';
import { BadgesController } from './badges.controller';

@Module({
  controllers: [StreaksController, ChallengesController, BadgesController],
  providers: [EngagementService],
})
export class EngagementModule {}