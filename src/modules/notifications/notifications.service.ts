import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { MarkNotificationsReadDto, SubscribeDeviceDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications() {
    const userId = await this.resolveDefaultUserId();
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

  async markRead(payload: MarkNotificationsReadDto) {
    const userId = await this.resolveDefaultUserId();
    const readAt = new Date();

    await this.prisma.notification.updateMany({
      where: { id: { in: payload.ids }, userId },
      data: { readAt },
    });

    return { ids: payload.ids, readAt: readAt.toISOString() };
  }

  async subscribe(payload: SubscribeDeviceDto) {
    const userId = await this.resolveDefaultUserId();

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

  async unsubscribe(deviceId: string) {
    const userId = await this.resolveDefaultUserId();
    await this.prisma.pushSubscription.deleteMany({ where: { userId, deviceId } });
    return { deviceId, status: 'removed' };
  }

  private async resolveDefaultUserId() {
    const user = await this.prisma.user.findFirst({ select: { id: true } });
    if (!user) {
      throw new NotFoundException('No users available for notifications');
    }
    return user.id;
  }
}
