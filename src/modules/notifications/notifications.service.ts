import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MarkNotificationsReadDto, SubscribeDeviceDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      createdAt: notification.createdAt.toISOString(),
      readAt: notification.readAt ? notification.readAt.toISOString() : null,
    }));
  }

  async markRead(userId: string, payload: MarkNotificationsReadDto) {
    const readAt = new Date();

    await this.prisma.notification.updateMany({
      where: { id: { in: payload.ids }, userId },
      data: { readAt },
    });

    return { ids: payload.ids, readAt: readAt.toISOString() };
  }

  async subscribe(userId: string, payload: SubscribeDeviceDto) {
    const subscription = await this.prisma.pushSubscription.upsert({
      where: { userId_deviceId: { userId, deviceId: payload.deviceId } },
      update: {
        platform: payload.platform,
        token: payload.token,
        locale: payload.locale,
      },
      create: {
        userId,
        deviceId: payload.deviceId,
        platform: payload.platform,
        token: payload.token,
        locale: payload.locale,
      },
    });

    return {
      deviceId: subscription.deviceId,
      platform: subscription.platform,
      locale: subscription.locale,
      subscribedAt: subscription.createdAt.toISOString(),
    };
  }

  async unsubscribe(userId: string, deviceId: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, deviceId } });
    return { deviceId, status: 'removed' };
  }

}
