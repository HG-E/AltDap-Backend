import { Injectable } from '@nestjs/common';
import { MarkNotificationsReadDto, SubscribeDeviceDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  getNotifications() {
    return [
      { id: 'notif_1', type: 'challenge', payload: { challengeId: 'challenge_daily_gratitude' }, createdAt: new Date().toISOString() },
    ];
  }

  markRead(payload: MarkNotificationsReadDto) {
    return { ids: payload.ids, readAt: new Date().toISOString() };
  }

  subscribe(payload: SubscribeDeviceDto) {
    return { ...payload, subscribedAt: new Date().toISOString() };
  }

  unsubscribe(deviceId: string) {
    return { deviceId, status: 'removed' };
  }
}