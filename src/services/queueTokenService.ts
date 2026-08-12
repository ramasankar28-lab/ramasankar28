import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface IssueTokenInput {
  patientId?: string;
  departmentId: string;
  doctorId?: string;
  priority?: 'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY' | 'PREGNANT_OR_DISABLED';
  patientName?: string;
  patientPhone?: string;
}

export const queueTokenService = {
  async getAllQueues() {
    const prisma = getPrismaClient();
    try {
      return await prisma.queue.findMany({
        include: {
          department: true,
          doctor: true,
          counter: true,
          queueEntries: {
            where: { status: { in: ['WAITING', 'CALLING', 'IN_CONSULTATION'] } },
            orderBy: { sequenceNo: 'asc' }
          }
        }
      });
    } catch (e) {
      return [];
    }
  },

  async getAllTokens(doctorId?: string, status?: string) {
    const prisma = getPrismaClient();
    try {
      return await prisma.token.findMany({
        where: {
          ...(doctorId ? { doctorId } : {}),
          ...(status ? { status: status as any } : {})
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async issueToken(input: IssueTokenInput) {
    validateRequiredFields(input, ['departmentId']);
    const prisma = getPrismaClient();

    try {
      // Find or create active queue for department/doctor
      const todayStr = new Date().toISOString().split('T')[0];
      let queue = await prisma.queue.findFirst({
        where: {
          departmentId: input.departmentId,
          ...(input.doctorId ? { doctorId: input.doctorId } : {}),
          date: todayStr
        }
      });

      if (!queue) {
        queue = await prisma.queue.create({
          data: {
            departmentId: input.departmentId,
            doctorId: input.doctorId,
            date: todayStr,
            currentTokenNo: 100,
            totalTokensIssued: 0
          }
        });
      }

      const dept = await prisma.department.findUnique({ where: { id: input.departmentId } });
      const prefix = dept ? dept.code.substring(0, 1) : 'T';
      const newSeq = queue.totalTokensIssued + 101;
      const tokenNumber = `${prefix}-${newSeq}`;

      // Calculate estimate wait time
      const waitingCount = await prisma.queueEntry.count({
        where: { queueId: queue.id, status: 'WAITING' }
      });

      let avgMins = dept ? dept.avgWaitTimeMins : 10;
      let estWait = waitingCount * avgMins;
      if (input.priority === 'EMERGENCY') estWait = 0;
      if (input.priority === 'SENIOR_CITIZEN') estWait = Math.floor(estWait * 0.5);

      const issueTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Create queue entry and token
      const queueEntry = await prisma.queueEntry.create({
        data: {
          queueId: queue.id,
          patientId: input.patientId,
          doctorId: input.doctorId,
          tokenNumber,
          sequenceNo: newSeq,
          priority: input.priority || 'NORMAL',
          status: 'WAITING',
          estimatedWaitMinutes: estWait,
          issueTime: issueTimeStr,
          counterNumber: 'Waiting Counter'
        }
      });

      const token = await prisma.token.create({
        data: {
          tokenNumber,
          sequenceNo: newSeq,
          priority: input.priority || 'NORMAL',
          status: 'WAITING',
          estimatedWaitMinutes: estWait,
          issueTime: issueTimeStr,
          counterNumber: 'Waiting Counter',
          departmentId: input.departmentId,
          doctorId: input.doctorId,
          patientId: input.patientId,
          queueEntryId: queueEntry.id
        }
      });

      // Update queue counts
      await prisma.queue.update({
        where: { id: queue.id },
        data: { totalTokensIssued: { increment: 1 } }
      });

      return token;
    } catch (err) {
      throw new ValidationError('Failed to issue queue token');
    }
  },

  async updateTokenStatus(tokenId: string, status: 'WAITING' | 'CALLING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED', counterNumber?: string) {
    if (!tokenId) throw new ValidationError('Token ID is required');
    const prisma = getPrismaClient();

    try {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const updated = await prisma.token.update({
        where: { id: tokenId },
        data: {
          status,
          ...(counterNumber ? { counterNumber } : {}),
          ...(status === 'IN_CONSULTATION' ? { calledTime: timeStr } : {}),
          ...(status === 'COMPLETED' ? { completedTime: timeStr } : {})
        }
      });

      if (updated.queueEntryId) {
        await prisma.queueEntry.update({
          where: { id: updated.queueEntryId },
          data: {
            status,
            ...(counterNumber ? { counterNumber } : {}),
            ...(status === 'IN_CONSULTATION' ? { calledTime: timeStr } : {}),
            ...(status === 'COMPLETED' ? { completedTime: timeStr } : {})
          }
        });
      }

      return updated;
    } catch (err) {
      throw new NotFoundError(`Token ${tokenId} not found`);
    }
  }
};
