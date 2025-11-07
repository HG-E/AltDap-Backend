import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaginatedResult } from '../../shared/interfaces/paginated-result.interface';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import { CompleteCourseDto, CreateCourseDto, UpdateModuleProgressDto } from './dto/courses.dto';

interface CourseSummary {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
}

type ModuleProgressRecord = Record<string, { status: string; score: number | null }>;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async listCourses(query: PaginationQueryDto): Promise<PaginatedResult<CourseSummary>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          points: true,
        },
      }),
      this.prisma.course.count(),
    ]);

    return paginate(courses, total, { ...query, page, limit });
  }

  async createCourse(payload: CreateCourseDto) {
    const tags: Prisma.JsonArray = payload.tags ? payload.tags.map(String) : [];

    return this.prisma.course.create({
      data: {
        title: payload.title,
        description: payload.description,
        category: payload.category,
        difficulty: payload.difficulty,
        points: payload.points,
        tags,
      },
    });
  }

  async getCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      points: course.points,
      heroImageUrl: course.heroImageUrl,
      tags: this.parseTags(course.tags),
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        type: module.type.toLowerCase(),
        orderIndex: module.orderIndex,
        contentUrl: module.contentUrl,
        metadata: module.metadata,
      })),
    };
  }

  async updateModuleProgress(courseId: string, moduleId: string, payload: UpdateModuleProgressDto) {
    const userId = await this.resolveDefaultUserId();

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const modules = course.modules.map((module) => module.id);
    if (!modules.includes(moduleId)) {
      throw new NotFoundException('Module not found for course');
    }

    const progress = await this.ensureProgressRecord(userId, courseId);
    const moduleStatus = this.toModuleProgressRecord(progress.moduleStatus);
    moduleStatus[moduleId] = { status: payload.status, score: payload.score ?? null };

    const progressPercent = this.calculateProgressPercent(moduleStatus, modules);
    const completedAt = progressPercent === 100 ? new Date() : progress.completedAt ?? null;

    await this.prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        moduleStatus,
        progressPercent,
        completedAt,
      },
    });

    return {
      courseId,
      moduleId,
      status: payload.status,
      score: payload.score ?? null,
      progressPercent,
      completedAt: completedAt ? completedAt.toISOString() : null,
    };
  }

  async completeCourse(courseId: string, payload: CompleteCourseDto) {
    const userId = await this.resolveDefaultUserId();

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        points: true,
        modules: { select: { id: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const progress = await this.ensureProgressRecord(userId, courseId);
    const moduleStatus = this.toModuleProgressRecord(progress.moduleStatus);
    for (const module of course.modules) {
      if (!moduleStatus[module.id]) {
        moduleStatus[module.id] = { status: 'completed', score: null };
      } else {
        moduleStatus[module.id].status = 'completed';
      }
    }

    const completedAt = new Date();
    await this.prisma.courseProgress.update({
      where: { id: progress.id },
      data: {
        moduleStatus,
        progressPercent: 100,
        completedAt,
      },
    });

    return {
      courseId,
      completedAt: completedAt.toISOString(),
      pointsAwarded: course.points,
      reflection: payload.reflection ?? null,
    };
  }

  async getProgress(courseId: string) {
    const userId = await this.resolveDefaultUserId();

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        modules: {
          orderBy: { orderIndex: 'asc' },
          select: { id: true },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const progress = await this.prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const moduleStatusRecord = this.toModuleProgressRecord(progress?.moduleStatus);
    const moduleStatus = course.modules.map((module) => ({
      moduleId: module.id,
      status: moduleStatusRecord[module.id]?.status ?? 'not_started',
      score: moduleStatusRecord[module.id]?.score ?? null,
    }));

    return {
      courseId,
      progressPercent: progress?.progressPercent ?? 0,
      moduleStatus,
      completedAt: progress?.completedAt ? progress.completedAt.toISOString() : null,
    };
  }

  async recommended(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { points: 'desc' },
        select: {
          id: true,
          title: true,
          category: true,
          difficulty: true,
          points: true,
        },
      }),
      this.prisma.course.count(),
    ]);

    return paginate(courses, total, { ...query, page, limit });
  }

  private parseTags(tags: Prisma.JsonValue): string[] {
    if (Array.isArray(tags)) {
      return tags.map(String);
    }
    return [];
  }

  private async resolveDefaultUserId(): Promise<string> {
    const user = await this.prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      throw new NotFoundException('No users available to associate course progress');
    }
    return user.id;
  }

  private async ensureProgressRecord(userId: string, courseId: string) {
    return this.prisma.courseProgress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: {
        userId,
        courseId,
        moduleStatus: {},
        progressPercent: 0,
      },
    });
  }

  private toModuleProgressRecord(moduleStatus: Prisma.JsonValue | null | undefined): ModuleProgressRecord {
    if (!moduleStatus || typeof moduleStatus !== 'object' || Array.isArray(moduleStatus)) {
      return {};
    }
    const entries = Object.entries(moduleStatus as Record<string, any>);
    return entries.reduce<ModuleProgressRecord>((acc, [moduleId, value]) => {
      const status = typeof value?.status === 'string' ? value.status : 'not_started';
      const score = typeof value?.score === 'number' ? value.score : null;
      acc[moduleId] = { status, score };
      return acc;
    }, {});
  }

  private calculateProgressPercent(moduleStatus: ModuleProgressRecord, moduleIds: string[]): number {
    if (moduleIds.length === 0) {
      return 0;
    }

    const completed = moduleIds.filter((id) => moduleStatus[id]?.status === 'completed').length;
    return Math.round((completed / moduleIds.length) * 100);
  }
}
