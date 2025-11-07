import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { PostsController } from './posts.controller';
import { ModerationController } from './moderation.controller';

@Module({
  controllers: [PostsController, ModerationController],
  providers: [CommunityService],
})
export class CommunityModule {}