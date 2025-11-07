import { Injectable } from '@nestjs/common';
import { CreateSupportMessageDto, CreateSupportTicketDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  getEmergencyResources() {
    return [
      { id: 'hotline_us', region: 'US', label: '988 Suicide & Crisis Lifeline', phone: '988' },
      { id: 'hotline_uk', region: 'UK', label: 'Samaritans', phone: '116 123' },
    ];
  }

  createTicket(payload: CreateSupportTicketDto) {
    return {
      ticketId: `ticket_${Date.now()}`,
      category: payload.category,
      description: payload.description,
      status: 'open',
    };
  }

  getTicket(ticketId: string) {
    return {
      ticketId,
      category: 'general',
      status: 'open',
      history: [],
    };
  }

  addMessage(ticketId: string, payload: CreateSupportMessageDto) {
    return {
      ticketId,
      messageId: `msg_${Date.now()}`,
      message: payload.message,
      attachment: payload.attachment ?? null,
      sentAt: new Date().toISOString(),
    };
  }
}