import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  departmentId?: string;
  date: string;
  timeSlot: string;
  type?: 'OPD' | 'FOLLOW_UP' | 'EMERGENCY' | 'ROUTINE_CHECKUP';
  symptoms?: string;
  notes?: string;
}

export const appointmentService = {
  async getAllAppointments(filter?: { doctorId?: string; patientId?: string; date?: string }) {
    const prisma = getPrismaClient();
    try {
      return await prisma.appointment.findMany({
        where: {
          ...(filter?.doctorId ? { doctorId: filter.doctorId } : {}),
          ...(filter?.patientId ? { patientId: filter.patientId } : {}),
          ...(filter?.date ? { date: filter.date } : {})
        },
        include: {
          patient: { include: { user: { select: { name: true, phone: true } } } },
          doctor: { select: { name: true, roomNumber: true, department: { select: { name: true } } } }
        },
        orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }]
      });
    } catch (e) {
      return [];
    }
  },

  async createAppointment(input: CreateAppointmentInput) {
    validateRequiredFields(input, ['patientId', 'doctorId', 'date', 'timeSlot']);

    const prisma = getPrismaClient();
    try {
      const appointment = await prisma.appointment.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          departmentId: input.departmentId,
          date: input.date,
          timeSlot: input.timeSlot,
          type: input.type || 'OPD',
          status: 'CONFIRMED',
          symptoms: input.symptoms || '',
          notes: input.notes || ''
        },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          doctor: { select: { name: true } }
        }
      });
      return appointment;
    } catch (err) {
      throw new ValidationError('Failed to schedule appointment');
    }
  },

  async updateStatus(appointmentId: string, status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW') {
    if (!appointmentId) throw new ValidationError('Appointment ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status }
      });
    } catch (err) {
      throw new NotFoundError(`Appointment ${appointmentId} not found`);
    }
  }
};
