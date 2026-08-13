import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export const doctorService = {
  async getAllDoctors(departmentId?: string) {
    const prisma = getPrismaClient() as any;
    try {
      const doctors = await prisma.doctor.findMany({
        where: departmentId ? { departmentId } : undefined,
        include: {
          department: true,
          schedules: true,
          user: {
            select: { id: true, email: true, phone: true }
          }
        },
        orderBy: { name: 'asc' }
      });
      return doctors;
    } catch (err) {
      return [];
    }
  },

  async getDoctorById(id: string) {
    if (!id) throw new ValidationError('Doctor ID is required');
    const prisma = getPrismaClient() as any;
    try {
      const doctor = await prisma.doctor.findUnique({
        where: { id },
        include: {
          department: true,
          schedules: true,
          appointments: {
            take: 10,
            orderBy: { date: 'desc' }
          },
          queues: {
            where: { status: 'IN_CONSULTATION' }
          }
        }
      });
      if (!doctor) throw new NotFoundError(`Doctor with ID ${id} not found`);
      return doctor;
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError(`Doctor with ID ${id} not found`);
    }
  },

  async updateAvailability(doctorId: string, isAvailable: boolean) {
    if (!doctorId) throw new ValidationError('Doctor ID is required');
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.doctor.update({
        where: { id: doctorId },
        data: { isAvailable }
      });
    } catch (err) {
      throw new NotFoundError(`Doctor with ID ${doctorId} not found`);
    }
  }
};
