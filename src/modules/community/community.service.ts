import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReactionDto,
  ModerationReviewDto,
  ReportPostDto,
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  private posts = [
    { id: 'post_1', content: 'Welcome to AltDap!', authorId: 'user_1', createdAt: new Date().toISOString() },
  ];

  listPosts(query: PaginationQueryDto) {
    return paginate(this.posts, this.posts.length, query);
  }

  createPost(payload: CreatePostDto) {
    const post = { id: `post_${Date.now()}`, ...payload, authorId: 'demo-user', createdAt: new Date().toISOString() };
    this.posts.unshift(post);
    return post;
  }

  getPost(postId: string) {
    return this.posts.find((p) => p.id === postId) ?? this.posts[0];
  }

  deletePost(postId: string) {
    this.posts = this.posts.filter((p) => p.id !== postId);
    return { postId, status: 'deleted' };
  }

  react(postId: string, payload: CreateReactionDto) {
    return { postId, ...payload, reactedAt: new Date().toISOString() };
  }

  report(postId: string, payload: ReportPostDto) {
    return { postId, status: 'queued', reason: payload.reason };
  }

  listComments(postId: string) {
    return [{ id: 'comment_1', postId, content: 'Thanks for sharing', authorId: 'user_2' }];
  }

  createComment(postId: string, payload: CreateCommentDto) {
    return {
      id: `comment_${Date.now()}`,
      postId,
      content: payload.content,
      parentCommentId: payload.parentCommentId ?? null,
      createdAt: new Date().toISOString(),
    };
  }

  moderationReview(payload: ModerationReviewDto) {
    return { ...payload, processedAt: new Date().toISOString() };
  }
}