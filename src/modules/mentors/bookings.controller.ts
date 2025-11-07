import { Body, Controller, Param, Patch, Post, UnauthorizedException } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/mentors.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class BookingsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Post('mentors/:mentorId/bookings')
  createBooking(
    @Param('mentorId') mentorId: string,
    @Body() payload: CreateBookingDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.mentorsService.createBooking(mentorId, this.requireUser(user).id, payload);
  }

  @Patch('bookings/:bookingId')
  @Roles(UserRole.MENTOR, UserRole.ADMIN)
  updateBooking(@Param('bookingId') bookingId: string, @Body() payload: UpdateBookingDto) {
    return this.mentorsService.updateBooking(bookingId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}