import { Body, Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { EngagementService } from './engagement.service';
import { ProtectStreakDto } from './dto/engagement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('streaks')
export class StreaksController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  getStreak(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.engagementService.getStreak(this.requireUser(user).id);
  }

  @Post('protect')
  protect(@Body() payload: ProtectStreakDto, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.engagementService.protectStreak(this.requireUser(user).id, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}