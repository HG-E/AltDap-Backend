import { Injectable, NotFoundException } from '@nestjs/common';
import { BookingStatus as PrismaBookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto';
import { paginate } from '../../shared/utils/paginate';
import { CreateBookingDto, CreateMentorDto, UpdateBookingDto, BookingStatus } from './dto/mentors.dto';

@Injectable()
export class MentorsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMentors(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [mentors, total] = await this.prisma.$transaction([
      this.prisma.mentor.findMany({
        skip,
        take: limit,
        orderBy: { user: { firstName: 'asc' } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
      this.prisma.mentor.count(),
    ]);

    const items = mentors.map((mentor) => ({
      id: mentor.id,
      userId: mentor.userId,
      bio: mentor.bio,
      specialties: this.parseSpecialties(mentor.specialties),
      rating: mentor.rating,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`.trim(),
      avatarUrl: mentor.user.avatarUrl,
    }));

    return paginate(items, total, { ...query, page, limit });
  }

  async createMentor(payload: CreateMentorDto) {
    const mentor = await this.prisma.mentor.create({
      data: {
        userId: payload.userId,
        bio: payload.bio,
        specialties: payload.specialties as Prisma.JsonArray,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    return {
      id: mentor.id,
      userId: mentor.userId,
      bio: mentor.bio,
      specialties: this.parseSpecialties(mentor.specialties),
      rating: mentor.rating,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`.trim(),
      avatarUrl: mentor.user.avatarUrl,
    };
  }

  async getMentor(mentorId: string) {
    const mentor = await this.prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        availability: {
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }

    return {
      id: mentor.id,
      userId: mentor.userId,
      bio: mentor.bio,
      specialties: this.parseSpecialties(mentor.specialties),
      rating: mentor.rating,
      mentorName: `${mentor.user.firstName} ${mentor.user.lastName}`.trim(),
      avatarUrl: mentor.user.avatarUrl,
      availability: mentor.availability.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isRecurring: slot.isRecurring,
      })),
    };
  }

  async getAvailability(mentorId: string) {
    const slots = await this.prisma.mentorAvailability.findMany({
      where: { mentorId },
      orderBy: { startTime: 'asc' },
    });

    return {
      mentorId,
      slots: slots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        isRecurring: slot.isRecurring,
      })),
    };
  }

  async createBooking(mentorId: string, userId: string, payload: CreateBookingDto) {
    await this.ensureMentorExists(mentorId);
    await this.ensureUserExists(userId);

    const booking = await this.prisma.booking.create({
      data: {
        mentorId,
        userId,
        scheduledStart: new Date(payload.scheduledStart),
        scheduledEnd: new Date(payload.scheduledEnd),
        guardianNotified: Boolean(payload.guardianEmail),
        channel: payload.guardianEmail ?? null,
      },
      include: {
        mentor: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        user: { select: { firstName: true, lastName: true } },
      },
    });

    return {
      bookingId: booking.id,
      mentorId: booking.mentorId,
      userId: booking.userId,
      scheduledStart: booking.scheduledStart.toISOString(),
      scheduledEnd: booking.scheduledEnd.toISOString(),
      status: booking.status.toLowerCase(),
      guardianEmail: payload.guardianEmail ?? null,
    };
  }

  async updateBooking(bookingId: string, payload: UpdateBookingDto) {
    const booking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: this.mapBookingStatus(payload.status) },
    });

    return {
      bookingId: booking.id,
      status: payload.status,
      updatedAt: booking.updatedAt.toISOString(),
      reason: payload.reason ?? null,
    };
  }

  async listOrganizations() {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { name: 'asc' },
    });

    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
      type: org.type,
      location: org.location,
      phone: org.phone,
      email: org.email,
      services: this.parseServices(org.services),
      imageUrl: org.imageUrl,
    }));
  }

  async getOrganization(orgId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      location: organization.location,
      phone: organization.phone,
      email: organization.email,
      services: this.parseServices(organization.services),
      imageUrl: organization.imageUrl,
    };
  }

  private parseSpecialties(specialties: Prisma.JsonValue | null | undefined) {
    if (!specialties || !Array.isArray(specialties)) {
      return [];
    }
    return specialties.map((item) => String(item));
  }

  private parseServices(services: Prisma.JsonValue | null | undefined) {
    if (!services || typeof services !== 'object') {
      return [];
    }
    if (Array.isArray(services)) {
      return services.map((item) => String(item));
    }
    return Object.entries(services as Record<string, unknown>).map(([key, value]) =>
      value ? `${key}: ${value}` : key,
    );
  }

  private mapBookingStatus(status: BookingStatus) {
    const mapping: Record<BookingStatus, PrismaBookingStatus> = {
      [BookingStatus.Pending]: PrismaBookingStatus.PENDING,
      [BookingStatus.Confirmed]: PrismaBookingStatus.CONFIRMED,
      [BookingStatus.Cancelled]: PrismaBookingStatus.CANCELLED,
      [BookingStatus.Completed]: PrismaBookingStatus.COMPLETED,
    };
    return mapping[status];
  }

  private async ensureMentorExists(mentorId: string) {
    const mentor = await this.prisma.mentor.findUnique({ where: { id: mentorId }, select: { id: true } });
    if (!mentor) {
      throw new NotFoundException('Mentor not found');
    }
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
