import { Body, Controller, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('questions')
  getQuestions() {
    return this.assessmentsService.getQuestions();
  }

  @Post('responses')
  submitResponses(@Body() payload: SubmitAssessmentDto, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.assessmentsService.submitResponses(this.requireUser(user).id, payload);
  }

  @Get('responses/:id')
  getResponse(@Param('id') id: string) {
    return this.assessmentsService.getResponseDetail(id);
  }

  @Get('recommendations')
  getRecommendations(@Query() query: PaginationQueryDto) {
    return this.assessmentsService.getRecommendations(query);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}