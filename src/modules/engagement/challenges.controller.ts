import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { CompleteChallengeDto } from './dto/engagement.dto';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('daily')
  listDaily() {
    return this.engagementService.getDailyChallenges();
  }

  @Post(':challengeId/complete')
  complete(@Param('challengeId') challengeId: string, @Body() payload: CompleteChallengeDto) {
    return this.engagementService.completeChallenge(challengeId, payload);
  }
}