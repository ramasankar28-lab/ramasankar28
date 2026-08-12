import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface SendMessageInput {
  senderId: string;
  receiverId: string;
  subject: string;
  body: string;
}

export const messageService = {
  async getUserMessages(userId: string) {
    if (!userId) throw new ValidationError('User ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.message.findMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }]
        },
        include: {
          userSender: { select: { id: true, name: true, role: true } },
          userReceiver: { select: { id: true, name: true, role: true } }
        },
        orderBy: { sentAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async sendMessage(input: SendMessageInput) {
    validateRequiredFields(input, ['senderId', 'receiverId', 'subject', 'body']);
    const prisma = getPrismaClient();
    try {
      return await prisma.message.create({
        data: {
          senderId: input.senderId,
          receiverId: input.receiverId,
          subject: input.subject,
          body: input.body,
          status: 'UNREAD'
        }
      });
    } catch (err) {
      throw new ValidationError('Failed to send internal message');
    }
  },

  async markMessageRead(messageId: string) {
    if (!messageId) throw new ValidationError('Message ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.message.update({
        where: { id: messageId },
        data: { status: 'READ', readAt: new Date() }
      });
    } catch (err) {
      throw new NotFoundError(`Message ${messageId} not found`);
    }
  }
};
