import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { UnlockBadgeDto } from './dto/engagement.dto';

@Controller('badges')
export class BadgesController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  list() {
    return this.engagementService.listBadges();
  }

  @Post(':badgeId/unlock')
  unlock(@Param('badgeId') badgeId: string, @Body() payload: UnlockBadgeDto) {
    return this.engagementService.unlockBadge(badgeId, payload);
  }
}