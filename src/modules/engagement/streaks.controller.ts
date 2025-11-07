import { Body, Controller, Get, Post } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { ProtectStreakDto } from './dto/engagement.dto';

@Controller('streaks')
export class StreaksController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  getStreak() {
    return this.engagementService.getStreak();
  }

  @Post('protect')
  protect(@Body() payload: ProtectStreakDto) {
    return this.engagementService.protectStreak(payload);
  }
}