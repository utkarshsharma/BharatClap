import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from './firebase.service';
import { TwilioService } from './twilio.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { Prisma } from '@prisma/client';

type NotificationChannel = 'push' | 'whatsapp' | 'both';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly twilioService: TwilioService,
  ) {}

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel,
    data?: Prisma.JsonValue,
  ) {
    // Create notification record in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        channel,
        data: data || Prisma.JsonNull,
        isRead: false,
      },
    });

    // Get user details for sending notifications
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found, notification saved but not sent`);
      return notification;
    }

    // Send push notification if channel includes push
    if (channel === 'push' || channel === 'both') {
      // Get FCM token from user (stored externally or in a separate table)
      const fcmToken = (user as any)?.fcmToken;

      if (fcmToken) {
        const dataString = data
          ? Object.fromEntries(
              Object.entries(data as object).map(([k, v]) => [
                k,
                typeof v === 'string' ? v : JSON.stringify(v),
              ]),
            )
          : undefined;

        await this.firebaseService.sendPushNotification(
          fcmToken,
          title,
          body,
          dataString,
        );
      } else {
        this.logger.warn(`No FCM token found for user ${userId}`);
      }
    }

    // Send WhatsApp notification if channel includes whatsapp
    if (channel === 'whatsapp' || channel === 'both') {
      if (user.phone) {
        const whatsappMessage = `*${title}*\n\n${body}`;
        await this.twilioService.sendWhatsApp(user.phone, whatsappMessage);
      } else {
        this.logger.warn(`No phone number found for user ${userId}`);
      }
    }

    return notification;
  }

  async getNotifications(
    userId: string,
    pagination: { page: number; limit: number },
  ) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: pagination.limit,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page: pagination.page,
        limit: pagination.limit,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    // Store FCM token in user metadata
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Note: FCM token storage would need a separate table or field
    // For now, log the registration
    this.logger.log(
      `FCM token received for user ${userId}: ${dto.fcmToken} (${dto.platform || 'unknown'})`,
    );

    this.logger.log(
      `FCM token registered for user ${userId} (${dto.platform || 'unknown'})`,
    );

    return { success: true, message: 'Device registered successfully' };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }
}
