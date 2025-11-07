import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { CompleteCourseDto, CreateCourseDto, UpdateModuleProgressDto } from './dto/courses.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.coursesService.listCourses(query);
  }

  @Get('recommended')
  recommended(@Query() query: PaginationQueryDto) {
    return this.coursesService.recommended(query);
  }

  @Post()
  create(@Body() payload: CreateCourseDto) {
    return this.coursesService.createCourse(payload);
  }

  @Get(':courseId/progress')
  progress(@Param('courseId') courseId: string) {
    return this.coursesService.getProgress(courseId);
  }

  @Get(':courseId')
  detail(@Param('courseId') courseId: string) {
    return this.coursesService.getCourse(courseId);
  }

  @Post(':courseId/modules/:moduleId/progress')
  moduleProgress(
    @Param('courseId') courseId: string,
    @Param('moduleId') moduleId: string,
    @Body() payload: UpdateModuleProgressDto,
  ) {
    return this.coursesService.updateModuleProgress(courseId, moduleId, payload);
  }

  @Post(':courseId/complete')
  complete(@Param('courseId') courseId: string, @Body() payload: CompleteCourseDto) {
    return this.coursesService.completeCourse(courseId, payload);
  }
}
