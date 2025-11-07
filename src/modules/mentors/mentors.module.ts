import { Module } from '@nestjs/common';
import { MentorsController } from './mentors.controller';
import { MentorsService } from './mentors.service';
import { BookingsController } from './bookings.controller';
import { OrganizationsController } from './organizations.controller';

@Module({
  controllers: [MentorsController, BookingsController, OrganizationsController],
  providers: [MentorsService],
})
export class MentorsModule {}