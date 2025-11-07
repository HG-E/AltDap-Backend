import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(UserRole.ADMIN)
  @Get('engagement')
  engagement() {
    return this.analyticsService.getEngagement();
  }

  @Roles(UserRole.ADMIN)
  @Get('course-completions')
  courseCompletions() {
    return this.analyticsService.getCourseCompletions();
  }

  @Roles(UserRole.ADMIN)
  @Get('community-health')
  communityHealth() {
    return this.analyticsService.getCommunityHealth();
  }
}