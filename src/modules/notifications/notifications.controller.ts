import { Body, Controller, Delete, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkNotificationsReadDto, SubscribeDeviceDto } from './dto/notifications.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser | undefined) {
    return this.notificationsService.getNotifications(this.requireUser(user).id);
  }

  @Post('mark-read')
  markRead(
    @Body() payload: MarkNotificationsReadDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.notificationsService.markRead(this.requireUser(user).id, payload);
  }

  @Post('subscribe')
  subscribe(
    @Body() payload: SubscribeDeviceDto,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    return this.notificationsService.subscribe(this.requireUser(user).id, payload);
  }

  @Delete('subscribe/:deviceId')
  unsubscribe(@Param('deviceId') deviceId: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.notificationsService.unsubscribe(this.requireUser(user).id, deviceId);
  }

  private requireUser(user?: AuthenticatedUser) {
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}