import { Controller, Get } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('engagement')
  engagement() {
    return this.analyticsService.getEngagement();
  }

  @Get('course-completions')
  courseCompletions() {
    return this.analyticsService.getCourseCompletions();
  }

  @Get('community-health')
  communityHealth() {
    return this.analyticsService.getCommunityHealth();
  }
}