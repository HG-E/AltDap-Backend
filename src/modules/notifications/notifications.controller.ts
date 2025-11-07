import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MarkNotificationsReadDto, SubscribeDeviceDto } from './dto/notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list() {
    return this.notificationsService.getNotifications();
  }

  @Post('mark-read')
  markRead(@Body() payload: MarkNotificationsReadDto) {
    return this.notificationsService.markRead(payload);
  }

  @Post('subscribe')
  subscribe(@Body() payload: SubscribeDeviceDto) {
    return this.notificationsService.subscribe(payload);
  }

  @Delete('subscribe/:deviceId')
  unsubscribe(@Param('deviceId') deviceId: string) {
    return this.notificationsService.unsubscribe(deviceId);
  }
}