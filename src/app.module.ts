import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/config/configuration';
import { PrismaModule } from './core/prisma/prisma.module';
import { HealthModule } from './core/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { MentorsModule } from './modules/mentors/mentors.module';
import { CommunityModule } from './modules/community/community.module';
import { SupportModule } from './modules/support/support.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AssessmentsModule,
    CoursesModule,
    EngagementModule,
    MentorsModule,
    CommunityModule,
    SupportModule,
    NotificationsModule,
    AnalyticsModule,
  ],
})
export class AppModule {}