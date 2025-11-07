import { Body, Controller, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { CompleteCourseDto, CreateCourseDto, UpdateModuleProgressDto } from './dto/courses.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

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
  @Roles(UserRole.ADMIN)
  create(@Body() payload: CreateCourseDto) {
    return this.coursesService.createCourse(payload);
  }

  @Get(':courseId/progress')
  progress(@Param('courseId') courseId: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.coursesService.getProgress(this.requireUser(user).id, courseId);
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
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.coursesService.updateModuleProgress(this.requireUser(user).id, courseId, moduleId, payload);
  }

  @Post(':courseId/complete')
  complete(
    @Param('courseId') courseId: string,
    @Body() payload: CompleteCourseDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.coursesService.completeCourse(this.requireUser(user).id, courseId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
