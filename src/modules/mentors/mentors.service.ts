import { Injectable } from '@nestjs/common';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import { CreateBookingDto, CreateMentorDto, UpdateBookingDto } from './dto/mentors.dto';

@Injectable()
export class MentorsService {
  private mentors = [
    { id: 'mentor_1', userId: 'user_mentor', bio: 'Licensed therapist', specialties: ['anxiety', 'mindfulness'], rating: 4.8 },
  ];

  listMentors(query: PaginationQueryDto) {
    return paginate(this.mentors, this.mentors.length, query);
  }

  createMentor(payload: CreateMentorDto) {
    const mentor = { id: `mentor_${this.mentors.length + 1}`, rating: 0, ...payload };
    this.mentors.push(mentor);
    return mentor;
  }

  getMentor(mentorId: string) {
    return this.mentors.find((m) => m.id === mentorId) ?? this.mentors[0];
  }

  getAvailability(mentorId: string) {
    return {
      mentorId,
      slots: [
        { startTime: '2024-11-08T15:00:00Z', endTime: '2024-11-08T15:30:00Z' },
        { startTime: '2024-11-09T16:00:00Z', endTime: '2024-11-09T16:30:00Z' },
      ],
    };
  }

  createBooking(mentorId: string, payload: CreateBookingDto) {
    return {
      bookingId: `booking_${Date.now()}`,
      mentorId,
      ...payload,
      status: 'pending',
    };
  }

  updateBooking(bookingId: string, payload: UpdateBookingDto) {
    return { bookingId, ...payload, updatedAt: new Date().toISOString() };
  }

  listOrganizations() {
    return [
      { id: 'org_1', name: 'Safe Harbor', type: 'Support Group', phone: '111-222-3333' },
      { id: 'org_2', name: 'Mindful Health', type: 'Mental Health', phone: '222-333-4444' },
    ];
  }

  getOrganization(orgId: string) {
    return this.listOrganizations().find((o) => o.id === orgId) ?? this.listOrganizations()[0];
  }
}