import { Body, Controller, Delete, Get, Param, Post, Query, UnauthorizedException } from '@nestjs/common';
import { CommunityService } from './community.service';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReactionDto,
  ReportPostDto,
} from './dto/community.dto';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('posts')
export class PostsController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.communityService.listPosts(query);
  }

  @Post()
  create(@Body() payload: CreatePostDto, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.communityService.createPost(this.requireUser(user).id, payload);
  }

  @Get(':postId')
  detail(@Param('postId') postId: string) {
    return this.communityService.getPost(postId);
  }

  @Delete(':postId')
  @Roles(UserRole.ADMIN)
  remove(@Param('postId') postId: string) {
    return this.communityService.deletePost(postId);
  }

  @Post(':postId/reactions')
  react(
    @Param('postId') postId: string,
    @Body() payload: CreateReactionDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.communityService.react(this.requireUser(user).id, postId, payload);
  }

  @Post(':postId/report')
  report(
    @Param('postId') postId: string,
    @Body() payload: ReportPostDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.communityService.report(this.requireUser(user).id, postId, payload);
  }

  @Get(':postId/comments')
  comments(@Param('postId') postId: string) {
    return this.communityService.listComments(postId);
  }

  @Post(':postId/comments')
  createComment(
    @Param('postId') postId: string,
    @Body() payload: CreateCommentDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.communityService.createComment(this.requireUser(user).id, postId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}