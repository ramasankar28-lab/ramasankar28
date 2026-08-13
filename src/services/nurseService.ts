import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface RecordVitalInput {
  patientId: string;
  nurseId?: string;
  spO2: number;
  heartRate: number;
  bpSystolic: number;
  bpDiastolic: number;
  temperature: number;
  respiratoryRate?: number;
  bedNumber: string;
  ward: string;
  notes?: string;
}

export const nurseService = {
  async getAllNurses(departmentId?: string) {
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.nurse.findMany({
        where: departmentId ? { departmentId } : undefined,
        include: {
          department: true,
          nurseTasks: { where: { status: 'PENDING' } },
          user: { select: { id: true, email: true, phone: true } }
        }
      });
    } catch (e) {
      return [];
    }
  },

  async recordVitalSigns(input: RecordVitalInput) {
    validateRequiredFields(input, ['patientId', 'spO2', 'heartRate', 'bpSystolic', 'bpDiastolic', 'temperature', 'bedNumber', 'ward']);
    
    let alertStatus: 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
    if (input.spO2 < 92 || input.bpSystolic > 160 || input.temperature > 38.5) {
      alertStatus = 'CRITICAL';
    } else if (input.spO2 < 95 || input.bpSystolic > 140 || input.temperature > 37.8) {
      alertStatus = 'WARNING';
    }

    const prisma = getPrismaClient() as any;
    try {
      const vitals = await prisma.vitalSign.create({
        data: {
          patientId: input.patientId,
          nurseId: input.nurseId,
          spO2: Number(input.spO2),
          heartRate: Number(input.heartRate),
          bpSystolic: Number(input.bpSystolic),
          bpDiastolic: Number(input.bpDiastolic),
          temperature: Number(input.temperature),
          respiratoryRate: input.respiratoryRate ? Number(input.respiratoryRate) : 18,
          alertStatus,
          bedNumber: input.bedNumber,
          ward: input.ward,
          notes: input.notes || ''
        }
      });
      return vitals;
    } catch (err) {
      throw new ValidationError('Failed to record vital signs');
    }
  },

  async getTasksByNurse(nurseId: string) {
    if (!nurseId) throw new ValidationError('Nurse ID is required');
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.nurseTask.findMany({
        where: { nurseId },
        include: { patient: { include: { user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async updateTaskStatus(taskId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DEFERRED') {
    if (!taskId) throw new ValidationError('Task ID is required');
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.nurseTask.update({
        where: { id: taskId },
        data: {
          status,
          completedAt: status === 'COMPLETED' ? new Date() : null
        }
      });
    } catch (err) {
      throw new NotFoundError(`Task ${taskId} not found`);
    }
  }
};
