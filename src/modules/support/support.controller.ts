import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportMessageDto, CreateSupportTicketDto } from './dto/support.dto';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('emergency-resources')
  emergencyResources() {
    return this.supportService.getEmergencyResources();
  }

  @Post('tickets')
  createTicket(@Body() payload: CreateSupportTicketDto) {
    return this.supportService.createTicket(payload);
  }

  @Get('tickets/:ticketId')
  getTicket(@Param('ticketId') ticketId: string) {
    return this.supportService.getTicket(ticketId);
  }

  @Post('tickets/:ticketId/messages')
  addMessage(@Param('ticketId') ticketId: string, @Body() payload: CreateSupportMessageDto) {
    return this.supportService.addMessage(ticketId, payload);
  }
}