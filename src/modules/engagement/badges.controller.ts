import { Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { UnlockBadgeDto } from './dto/engagement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('badges')
export class BadgesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.engagementService.listBadges(this.requireUser(user).id);
  }

  @Post(':badgeId/unlock')
  unlock(
    @Param('badgeId') badgeId: string,
    @Body() payload: UnlockBadgeDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.engagementService.unlockBadge(this.requireUser(user).id, badgeId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}