import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { CreateMentorDto } from './dto/mentors.dto';

@Controller('mentors')
export class MentorsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.mentorsService.listMentors(query);
  }

  @Post()
  create(@Body() payload: CreateMentorDto) {
    return this.mentorsService.createMentor(payload);
  }

  @Get(':mentorId')
  detail(@Param('mentorId') mentorId: string) {
    return this.mentorsService.getMentor(mentorId);
  }

  @Get(':mentorId/availability')
  availability(@Param('mentorId') mentorId: string) {
    return this.mentorsService.getAvailability(mentorId);
  }
}