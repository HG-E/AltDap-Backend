import { Injectable } from '@nestjs/common';
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

@Injectable()
export class CoursesService {
  private readonly courses: CourseSummary[] = [
    { id: 'course_resilience', title: 'Building Resilience', category: 'wellness', difficulty: 'beginner', points: 200 },
    { id: 'course_finance', title: 'Money Basics', category: 'financial', difficulty: 'intermediate', points: 300 },
  ];

  listCourses(query: PaginationQueryDto): PaginatedResult<CourseSummary> {
    return paginate(this.courses, this.courses.length, query);
  }

  createCourse(payload: CreateCourseDto) {
    const newCourse = { id: `course_${this.courses.length + 1}`, ...payload };
    this.courses.push({
      id: newCourse.id,
      title: payload.title,
      category: payload.category,
      difficulty: payload.difficulty,
      points: payload.points,
    });
    return newCourse;
  }

  getCourse(courseId: string) {
    return {
      ...this.courses.find((c) => c.id === courseId) ?? this.courses[0],
      modules: [
        { id: 'module1', title: 'Daily habits', type: 'video', orderIndex: 1 },
        { id: 'module2', title: 'Reflection', type: 'activity', orderIndex: 2 },
      ],
    };
  }

  updateModuleProgress(courseId: string, moduleId: string, payload: UpdateModuleProgressDto) {
    return {
      courseId,
      moduleId,
      status: payload.status,
      score: payload.score ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  completeCourse(courseId: string, payload: CompleteCourseDto) {
    return {
      courseId,
      completedAt: new Date().toISOString(),
      pointsAwarded: 200,
      reflection: payload.reflection,
    };
  }

  getProgress(courseId: string) {
    return {
      courseId,
      progressPercent: 65,
      moduleStatus: [
        { moduleId: 'module1', status: 'completed' },
        { moduleId: 'module2', status: 'started' },
      ],
    };
  }

  recommended(query: PaginationQueryDto) {
    return paginate(this.courses.slice(0, 1), 1, query);
  }
}