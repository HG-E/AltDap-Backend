import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateSupportMessageDto, CreateSupportTicketDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async getEmergencyResources() {
    const resources = await this.prisma.emergencyResource.findMany({ orderBy: { region: 'asc' } });
    return resources.map((resource) => ({
      id: resource.id,
      region: resource.region,
      label: resource.label,
      phone: resource.phone,
      sms: resource.sms,
      website: resource.website,
      availableHours: resource.availableHours,
    }));
  }

  async createTicket(userId: string, payload: CreateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        category: payload.category,
        messages: payload.description
          ? {
              create: {
                senderId: userId,
                message: payload.description,
              },
            }
          : undefined,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return {
      ticketId: ticket.id,
      status: ticket.status.toLowerCase(),
      category: ticket.category,
      createdAt: ticket.createdAt.toISOString(),
      messages: ticket.messages.map((message) => ({
        id: message.id,
        message: message.message,
        attachments: message.attachments,
        sentAt: message.createdAt.toISOString(),
      })),
    };
  }

  async getTicket(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }

    return {
      ticketId: ticket.id,
      category: ticket.category,
      status: ticket.status.toLowerCase(),
      priority: ticket.priority.toLowerCase(),
      history: ticket.messages.map((message) => ({
        id: message.id,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName,
          lastName: message.sender.lastName,
        },
        message: message.message,
        attachments: message.attachments,
        sentAt: message.createdAt.toISOString(),
      })),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
    };
  }

  async addMessage(userId: string, ticketId: string, payload: CreateSupportMessageDto) {
    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message: payload.message,
        attachments: payload.attachment ? [payload.attachment] : undefined,
      },
    });

    return {
      ticketId,
      messageId: message.id,
      message: message.message,
      attachment: payload.attachment ?? null,
      sentAt: message.createdAt.toISOString(),
    };
  }

}
