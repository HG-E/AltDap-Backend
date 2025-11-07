import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TargetType } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import { AccountStatus } from './dto/admin.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getEngagement() {
    const since = this.daysAgo(1);

    const [dailyActiveUsers, protectedStreaks, recentSessions] = await this.prisma.$transaction([
      this.prisma.session.count({ where: { createdAt: { gte: since } } }),
      this.prisma.streak.count({ where: { shieldsRemaining: { gt: 0 } } }),
      this.prisma.session.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, expiresAt: true },
      }),
    ]);

    const avgSessionMinutes = this.averageSessionMinutes(recentSessions);

    return {
      dau: dailyActiveUsers,
      streakProtected: protectedStreaks,
      avgSessionMinutes,
    };
  }

  async getCourseCompletions() {
    const completionGroups = await this.prisma.courseProgress.groupBy({
      by: ['courseId'],
      where: { completedAt: { not: null } },
      _count: { courseId: true },
    });

    const courseIds = completionGroups.map((group) => group.courseId);
    const courses = courseIds.length
      ? await this.prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true },
        })
      : [];
    const courseLookup = new Map(courses.map((course) => [course.id, course.title]));

    const byCourse = completionGroups.map((group) => ({
      id: group.courseId,
      title: courseLookup.get(group.courseId) ?? 'Unknown course',
      completions: group._count.courseId,
    }));

    const totalCompletions = byCourse.reduce((sum, item) => sum + item.completions, 0);

    return {
      totalCompletions,
      byCourse,
    };
  }

  async getCommunityHealth() {
    const since = this.daysAgo(7);

    const [postsLast7Days, reportsLast7Days, flaggedPosts] = await this.prisma.$transaction([
      this.prisma.post.count({ where: { createdAt: { gte: since } } }),
      this.prisma.report.count({
        where: {
          createdAt: { gte: since },
          targetType: { in: [TargetType.POST, TargetType.COMMENT] },
        },
      }),
      this.prisma.post.count({
        where: {
          updatedAt: { gte: since },
          moderationStatus: { not: null },
        },
      }),
    ]);

    const aiToxicityRate = postsLast7Days === 0 ? 0 : Number((flaggedPosts / postsLast7Days).toFixed(2));

    return {
      postsLast7Days,
      reportsLast7Days,
      aiToxicityRate,
    };
  }

  async listUsers(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, settings: true, createdAt: true },
      }),
      this.prisma.user.count(),
    ]);

    const items = users.map((user) => ({
      id: user.id,
      email: user.email,
      status: this.resolveAccountStatus(user.settings),
      joinedAt: user.createdAt.toISOString(),
    }));

    return paginate(items, total, { ...query, page, limit });
  }

  async updateUserStatus(userId: string, status: AccountStatus) {
    const record = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    if (!record) {
      throw new NotFoundException('User not found');
    }

    const nextSettings = {
      ...this.parseSettings(record.settings),
      accountStatus: status,
    };

    await this.prisma.user.update({
      where: { id: userId },
      data: { settings: nextSettings as Prisma.JsonObject },
    });

    return { userId, status, updatedAt: new Date().toISOString() };
  }

  private daysAgo(days: number) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  }

  private averageSessionMinutes(sessions: Array<{ createdAt: Date; expiresAt: Date }>) {
    if (sessions.length === 0) {
      return 0;
    }

    const totalMinutes = sessions.reduce((sum, session) => {
      const duration = Math.max(session.expiresAt.getTime() - session.createdAt.getTime(), 0);
      return sum + duration / 60000;
    }, 0);

    return Number((totalMinutes / sessions.length).toFixed(1));
  }

  private parseSettings(settings: Prisma.JsonValue | null | undefined): Record<string, any> {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return {};
    }
    return settings as Record<string, any>;
  }

  private resolveAccountStatus(settings: Prisma.JsonValue | null | undefined): AccountStatus {
    const parsed = this.parseSettings(settings);
    return parsed.accountStatus === AccountStatus.Suspended ? AccountStatus.Suspended : AccountStatus.Active;
  }
}
