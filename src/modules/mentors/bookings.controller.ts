import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { MentorsService } from './mentors.service';
import { CreateBookingDto, UpdateBookingDto } from './dto/mentors.dto';

@Controller()
export class BookingsController {
  constructor(private readonly mentorsService: MentorsService) {}

  @Post('mentors/:mentorId/bookings')
  createBooking(@Param('mentorId') mentorId: string, @Body() payload: CreateBookingDto) {
    return this.mentorsService.createBooking(mentorId, payload);
  }

  @Patch('bookings/:bookingId')
  updateBooking(@Param('bookingId') bookingId: string, @Body() payload: UpdateBookingDto) {
    return this.mentorsService.updateBooking(bookingId, payload);
  }
}