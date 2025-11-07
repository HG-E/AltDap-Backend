import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { UpdateUserStatusDto } from './dto/admin.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('users')
  listUsers(@Query() query: PaginationQueryDto) {
    return this.analyticsService.listUsers(query);
  }

  @Patch('users/:userId/status')
  updateStatus(@Param('userId') userId: string, @Body() payload: UpdateUserStatusDto) {
    return this.analyticsService.updateUserStatus(userId, payload.status);
  }
}