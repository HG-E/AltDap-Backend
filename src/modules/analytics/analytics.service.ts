import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import { AccountStatus } from './dto/admin.dto';

@Injectable()
export class AnalyticsService {
  getEngagement() {
    return {
      dau: 1250,
      streakProtected: 320,
      avgSessionMinutes: 8.4,
    };
  }

  getCourseCompletions() {
    return {
      totalCompletions: 540,
      byCourse: [
        { id: 'course_resilience', completions: 240 },
        { id: 'course_finance', completions: 120 },
      ],
    };
  }

  getCommunityHealth() {
    return {
      postsLast7Days: 180,
      reportsLast7Days: 3,
      aiToxicityRate: 0.01,
    };
  }

  listUsers(query: PaginationQueryDto) {
    const users = [
      { id: 'user_1', email: 'teen@example.com', status: AccountStatus.Active },
      { id: 'user_2', email: 'mentor@example.com', status: AccountStatus.Suspended },
    ];
    return paginate(users, users.length, query);
  }

  updateUserStatus(userId: string, status: AccountStatus) {
    return { userId, status, updatedAt: new Date().toISOString() };
  }
}