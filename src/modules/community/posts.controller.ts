import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { CommunityService } from './community.service';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReactionDto,
  ReportPostDto,
} from './dto/community.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.communityService.listPosts(query);
  }

  @Post()
  create(@Body() payload: CreatePostDto) {
    return this.communityService.createPost(payload);
  }

  @Get(':postId')
  detail(@Param('postId') postId: string) {
    return this.communityService.getPost(postId);
  }

  @Delete(':postId')
  remove(@Param('postId') postId: string) {
    return this.communityService.deletePost(postId);
  }

  @Post(':postId/reactions')
  react(@Param('postId') postId: string, @Body() payload: CreateReactionDto) {
    return this.communityService.react(postId, payload);
  }

  @Post(':postId/report')
  report(@Param('postId') postId: string, @Body() payload: ReportPostDto) {
    return this.communityService.report(postId, payload);
  }

  @Get(':postId/comments')
  comments(@Param('postId') postId: string) {
    return this.communityService.listComments(postId);
  }

  @Post(':postId/comments')
  createComment(@Param('postId') postId: string, @Body() payload: CreateCommentDto) {
    return this.communityService.createComment(postId, payload);
  }
}