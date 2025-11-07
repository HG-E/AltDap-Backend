import { Body, Controller, Post } from '@nestjs/common';
import { CommunityService } from './community.service';
import { ModerationReviewDto } from './dto/community.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly communityService: CommunityService) {}

  @Roles(UserRole.ADMIN)
  @Post('reviews')
  review(@Body() payload: ModerationReviewDto) {
    return this.communityService.moderationReview(payload);
  }
}