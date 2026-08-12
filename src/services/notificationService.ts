import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface SendNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'QUEUE_ALERT' | 'APPOINTMENT_REMINDER' | 'LAB_RESULT' | 'PHARMACY_READY' | 'BILL_DUE' | 'SYSTEM_ALERT';
  link?: string;
}

export const notificationService = {
  async getUserNotifications(userId: string) {
    if (!userId) throw new ValidationError('User ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async sendNotification(input: SendNotificationInput) {
    validateRequiredFields(input, ['userId', 'title', 'message']);
    const prisma = getPrismaClient();
    try {
      return await prisma.notification.create({
        data: {
          userId: input.userId,
          title: input.title,
          message: input.message,
          type: input.type || 'SYSTEM_ALERT',
          link: input.link || ''
        }
      });
    } catch (err) {
      throw new ValidationError('Failed to send notification');
    }
  },

  async markAsRead(notificationId: string) {
    if (!notificationId) throw new ValidationError('Notification ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true, readAt: new Date() }
      });
    } catch (err) {
      throw new NotFoundError(`Notification ${notificationId} not found`);
    }
  }
};
