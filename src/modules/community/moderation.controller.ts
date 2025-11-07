import { Body, Controller, Post } from '@nestjs/common';
import { CommunityService } from './community.service';
import { ModerationReviewDto } from './dto/community.dto';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('reviews')
  review(@Body() payload: ModerationReviewDto) {
    return this.communityService.moderationReview(payload);
  }
}