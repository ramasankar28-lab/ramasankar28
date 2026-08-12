import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface CreatePrescriptionInput {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  diagnosis: string;
  notes?: string;
  medicines: Array<{
    inventoryId?: string;
    name: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    quantity?: number;
  }>;
}

export const pharmacyService = {
  async getPrescriptions(patientId?: string, status?: string) {
    const prisma = getPrismaClient();
    try {
      return await prisma.prescription.findMany({
        where: {
          ...(patientId ? { patientId } : {}),
          ...(status ? { status: status as any } : {})
        },
        include: {
          patient: { include: { user: { select: { name: true, mrn: true } } } },
          doctor: { select: { name: true } },
          medicines: { include: { inventory: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async getInventory() {
    const prisma = getPrismaClient();
    try {
      return await prisma.medicineInventory.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (e) {
      return [];
    }
  },

  async createPrescription(input: CreatePrescriptionInput) {
    validateRequiredFields(input, ['patientId', 'doctorId', 'diagnosis', 'medicines']);
    if (!Array.isArray(input.medicines) || input.medicines.length === 0) {
      throw new ValidationError('At least one prescribed medicine is required');
    }

    const prisma = getPrismaClient();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const prescription = await prisma.prescription.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          appointmentId: input.appointmentId,
          date: todayStr,
          diagnosis: input.diagnosis,
          notes: input.notes || '',
          status: 'ISSUED',
          medicines: {
            create: input.medicines.map(m => ({
              inventoryId: m.inventoryId,
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              durationDays: Number(m.durationDays) || 5,
              quantity: Number(m.quantity) || 1
            }))
          }
        },
        include: { medicines: true }
      });
      return prescription;
    } catch (err) {
      throw new ValidationError('Failed to create prescription order');
    }
  },

  async updatePrescriptionStatus(prescriptionId: string, status: 'DRAFT' | 'ISSUED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPENSED' | 'CANCELLED') {
    if (!prescriptionId) throw new ValidationError('Prescription ID is required');
    const prisma = getPrismaClient();
    try {
      return await prisma.prescription.update({
        where: { id: prescriptionId },
        data: { status }
      });
    } catch (err) {
      throw new NotFoundError(`Prescription ${prescriptionId} not found`);
    }
  }
};
