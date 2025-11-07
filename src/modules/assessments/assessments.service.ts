import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getQuestions() {
    const version = await this.prisma.assessmentVersion.findFirst({
      where: { isActive: true },
      orderBy: { version: 'desc' },
    });

    if (!version) {
      throw new NotFoundException('No active assessment configured');
    }

    return {
      id: version.id,
      version: version.version,
      questions: version.questions,
    };
  }

  async submitResponses(userId: string, payload: SubmitAssessmentDto) {
    await this.ensureVersionExists(payload.versionId);

    const recommendations = await this.buildRecommendations(payload.tags ?? []);

    const response = await this.prisma.assessmentResponse.create({
      data: {
        userId,
        versionId: payload.versionId,
        answers: payload.answers as Prisma.JsonArray,
        recommendations,
      },
    });

    return {
      responseId: response.id,
      recommendations: (recommendations as unknown[]) ?? [],
    };
  }

  async getResponseDetail(id: string) {
    const response = await this.prisma.assessmentResponse.findUnique({
      where: { id },
      include: {
        version: { select: { id: true, version: true, questions: true } },
      },
    });

    if (!response) {
      throw new NotFoundException('Assessment response not found');
    }

    return {
      id: response.id,
      versionId: response.versionId,
      version: response.version.version,
      answers: response.answers,
      recommendations: response.recommendations,
      createdAt: response.createdAt.toISOString(),
    };
  }

  async getRecommendations(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [courses, total, maxPointsAggregate] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        skip,
        take: limit,
        orderBy: { points: 'desc' },
        select: { id: true, title: true, category: true, points: true },
      }),
      this.prisma.course.count(),
      this.prisma.course.aggregate({ _max: { points: true } }),
    ]);

    const maxPoints = maxPointsAggregate._max.points ?? 0;

    const items = courses.map((course) => ({
      id: course.id,
      type: 'course',
      title: course.title,
      category: course.category,
      score: maxPoints > 0 ? Number((course.points / maxPoints).toFixed(2)) : 0,
    }));

    return paginate(items, total, { ...query, page, limit });
  }

  private async ensureVersionExists(versionId: string) {
    const version = await this.prisma.assessmentVersion.findUnique({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Assessment version not found');
    }
  }

  private async buildRecommendations(tags: string[]) {
    const normalizedTags = tags.map((tag) => tag.toLowerCase());
    const courses = await this.prisma.course.findMany({
      orderBy: { points: 'desc' },
      take: 5,
      select: { id: true, title: true, tags: true, category: true },
    });

    return courses.map((course) => {
      const courseTags = this.parseTags(course.tags);
      const overlap = courseTags.filter((tag) => normalizedTags.includes(tag.toLowerCase()));
      const reason = overlap.length
        ? `Matches interests: ${overlap.join(', ')}`
        : `High-impact ${course.category.toLowerCase()} content`;

      return {
        type: 'course',
        id: course.id,
        title: course.title,
        reason,
      };
    }) as Prisma.JsonArray;
  }

  private parseTags(tags: Prisma.JsonValue | null | undefined): string[] {
    if (!tags || !Array.isArray(tags)) {
      return [];
    }
    return tags.map((tag) => String(tag));
  }

}
