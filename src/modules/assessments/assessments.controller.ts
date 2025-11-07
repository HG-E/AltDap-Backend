import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssessmentsService } from './assessments.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('questions')
  getQuestions() {
    return this.assessmentsService.getQuestions();
  }

  @Post('responses')
  submitResponses(@Body() payload: SubmitAssessmentDto) {
    return this.assessmentsService.submitResponses(payload);
  }

  @Get('responses/:id')
  getResponse(@Param('id') id: string) {
    return this.assessmentsService.getResponseDetail(id);
  }

  @Get('recommendations')
  getRecommendations(@Query() query: PaginationQueryDto) {
    return this.assessmentsService.getRecommendations(query);
  }
}