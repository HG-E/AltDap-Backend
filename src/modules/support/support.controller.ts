import { Body, Controller, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportMessageDto, CreateSupportTicketDto } from './dto/support.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get('emergency-resources')
  emergencyResources() {
    return this.supportService.getEmergencyResources();
  }

  @Post('tickets')
  createTicket(@Body() payload: CreateSupportTicketDto, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.supportService.createTicket(this.requireUser(user).id, payload);
  }

  @Get('tickets/:ticketId')
  getTicket(@Param('ticketId') ticketId: string) {
    return this.supportService.getTicket(ticketId);
  }

  @Post('tickets/:ticketId/messages')
  addMessage(
    @Param('ticketId') ticketId: string,
    @Body() payload: CreateSupportMessageDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.supportService.addMessage(this.requireUser(user).id, ticketId, payload);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}