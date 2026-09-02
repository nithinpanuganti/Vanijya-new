import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface InMemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export const FALLBACK_NOTIFICATIONS: InMemNotification[] = [
  {
    id: 'notif-1',
    userId: 'usr-farmer-1',
    title: 'Account Approved',
    message: 'Your Vanijya Farmer account has been approved by administrator.',
    type: 'APPROVAL',
    isRead: false,
    createdAt: new Date(),
  },
  {
    id: 'notif-2',
    userId: 'usr-admin-1',
    title: 'System Initialized',
    message: 'Vanijya Unified Platform is online and monitoring activity.',
    type: 'SYSTEM',
    isRead: true,
    createdAt: new Date(),
  },
];

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { userId: string; title: string; message: string; type?: string }) {
    const item: InMemNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || 'SYSTEM',
      isRead: false,
      createdAt: new Date(),
    };

    FALLBACK_NOTIFICATIONS.unshift(item);

    if (this.prisma.isConnected) {
      try {
        return await this.prisma.notification.create({
          data: {
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || 'SYSTEM',
          },
        });
      } catch (err) {
        // Safe fallback in memory
      }
    }

    return item;
  }

  async notifyAdmins(data: { title: string; message: string; type?: string }) {
    if (this.prisma.isConnected) {
      try {
        const admins = await this.prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true },
        });

        if (admins.length > 0) {
          await this.prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              title: data.title,
              message: data.message,
              type: data.type || 'REGISTRATION',
            })),
          });
          return;
        }
      } catch (err) {
        // Fallback
      }
    }

    // Fallback for demo admin
    await this.create({
      userId: 'usr-admin-1',
      title: data.title,
      message: data.message,
      type: data.type || 'REGISTRATION',
    });
  }

  async getUserNotifications(userId: string) {
    if (!this.prisma.isConnected) {
      return FALLBACK_NOTIFICATIONS.filter((n) => n.userId === userId);
    }

    try {
      return await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      return FALLBACK_NOTIFICATIONS.filter((n) => n.userId === userId);
    }
  }

  async markAsRead(id: string, userId: string) {
    const fallbackItem = FALLBACK_NOTIFICATIONS.find((n) => n.id === id && n.userId === userId);
    if (fallbackItem) {
      fallbackItem.isRead = true;
    }

    if (this.prisma.isConnected) {
      try {
        return await this.prisma.notification.update({
          where: { id },
          data: { isRead: true },
        });
      } catch (err) {
        // Fallback
      }
    }

    return fallbackItem || { success: true };
  }
}
