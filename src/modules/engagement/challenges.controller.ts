import { Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { CompleteChallengeDto } from './dto/engagement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('challenges')
export class ChallengesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('daily')
  listDaily() {
    return this.engagementService.getDailyChallenges();
  }

  @Post(':challengeId/complete')
  complete(
    @Param('challengeId') challengeId: string,
    @Body() payload: CompleteChallengeDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.engagementService.completeChallenge(this.requireUser(user).id, challengeId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}