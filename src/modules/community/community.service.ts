import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  ReactionType as PrismaReactionType,
  TargetType,
} from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import {
  CreateCommentDto,
  CreatePostDto,
  CreateReactionDto,
  ModerationReviewDto,
  ReactionType,
  ReportPostDto,
} from './dto/community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async listPosts(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [posts, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          _count: { select: { reactions: true, comments: true } },
        },
      }),
      this.prisma.post.count(),
    ]);

    const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrls: this.parseMediaUrls(post.mediaUrls),
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        avatarUrl: post.author.avatarUrl,
      },
      reactionCount: post._count.reactions,
      commentCount: post._count.comments,
      moderationStatus: post.moderationStatus,
      createdAt: post.createdAt.toISOString(),
    }));

    return paginate(items, total, { ...query, page, limit });
  }

  async createPost(payload: CreatePostDto) {
    const authorId = await this.resolveDefaultUserId();

    const post = await this.prisma.post.create({
      data: {
        authorId,
        content: payload.content,
        mediaUrls: (payload.mediaUrls ?? []) as Prisma.JsonArray,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return {
      id: post.id,
      content: post.content,
      mediaUrls: this.parseMediaUrls(post.mediaUrls),
      author: post.author,
      createdAt: post.createdAt.toISOString(),
    };
  }

  async getPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
        },
        reactions: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: this.parseMediaUrls(post.mediaUrls),
      author: post.author,
      reactions: post.reactions.map((reaction) => ({
        id: reaction.id,
        type: reaction.type.toLowerCase(),
        userId: reaction.userId,
        createdAt: reaction.createdAt.toISOString(),
      })),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        parentCommentId: comment.parentCommentId,
        author: comment.author,
        createdAt: comment.createdAt.toISOString(),
      })),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      moderationStatus: post.moderationStatus,
    };
  }

  async deletePost(postId: string) {
    await this.prisma.post.delete({ where: { id: postId } });
    return { postId, status: 'deleted' };
  }

  async react(postId: string, payload: CreateReactionDto) {
    const userId = await this.resolveDefaultUserId();
    const reactionType = this.mapReactionType(payload.type);

    const reaction = await this.prisma.reaction.upsert({
      where: { postId_userId_type: { postId, userId, type: reactionType } },
      update: {},
      create: {
        postId,
        userId,
        type: reactionType,
      },
    });

    return {
      postId,
      type: payload.type,
      reactedAt: reaction.createdAt.toISOString(),
    };
  }

  async report(postId: string, payload: ReportPostDto) {
    const reporterId = await this.resolveDefaultUserId();
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetId: postId,
        targetType: TargetType.POST,
        reason: payload.reason,
      },
    });

    return {
      postId,
      reportId: report.id,
      status: 'submitted',
      reason: payload.reason,
    };
  }

  async listComments(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    return comments.map((comment) => ({
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    }));
  }

  async createComment(postId: string, payload: CreateCommentDto) {
    const userId = await this.resolveDefaultUserId();

    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: payload.content,
        parentCommentId: payload.parentCommentId,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    return {
      id: comment.id,
      postId: comment.postId,
      content: comment.content,
      parentCommentId: comment.parentCommentId,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async moderationReview(payload: ModerationReviewDto) {
    const post = await this.prisma.post.update({
      where: { id: payload.targetId },
      data: { moderationStatus: payload.decision },
    });

    await this.prisma.report.updateMany({
      where: { targetId: payload.targetId },
      data: { status: payload.decision },
    });

    return {
      targetId: payload.targetId,
      decision: payload.decision,
      notes: payload.notes ?? null,
      processedAt: post.updatedAt.toISOString(),
    };
  }

  private parseMediaUrls(media: Prisma.JsonValue | null) {
    if (!media || !Array.isArray(media)) {
      return [];
    }
    return media.map((item) => String(item));
  }

  private mapReactionType(type: ReactionType) {
    const mapping: Record<ReactionType, PrismaReactionType> = {
      [ReactionType.Like]: PrismaReactionType.LIKE,
      [ReactionType.Support]: PrismaReactionType.SUPPORT,
      [ReactionType.Celebrate]: PrismaReactionType.CELEBRATE,
    };
    return mapping[type];
  }

  private async resolveDefaultUserId() {
    const user = await this.prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      throw new NotFoundException('No users available for community actions');
    }
    return user.id;
  }
}
