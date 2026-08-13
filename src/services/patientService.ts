import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface PatientProfileData {
  name: string;
  email: string;
  phone?: string;
  bloodGroup?: string;
  allergies?: string[];
  medicalHistory?: string;
  emergencyContact?: string;
  dob?: string;
  gender?: string;
  address?: string;
}

export const patientService = {
  async getAllPatients() {
    const prisma = getPrismaClient() as any;
    try {
      const patients = await prisma.patient.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              dob: true,
              gender: true,
              address: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
              emergencyContactRelation: true,
              createdAt: true
            }
          },
          vitalSigns: {
            orderBy: { recordedAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return patients;
    } catch (e) {
      // Fallback
      return [];
    }
  },

  async getPatientById(id: string) {
    if (!id) throw new ValidationError('Patient ID is required');
    const prisma = getPrismaClient() as any;
    try {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              dob: true,
              gender: true,
              address: true,
              emergencyContactName: true,
              emergencyContactPhone: true,
              emergencyContactRelation: true
            }
          },
          appointments: true,
          queueEntries: true,
          prescriptions: {
            include: { medicines: true }
          },
          labReports: {
            include: { labTest: true }
          },
          bills: true,
          vitalSigns: {
            orderBy: { recordedAt: 'desc' }
          },
          patientRecords: true
        }
      });
      if (!patient) throw new NotFoundError(`Patient with ID ${id} not found`);
      return patient;
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError(`Patient with ID ${id} not found`);
    }
  },

  async getPatientByMrn(mrn: string) {
    if (!mrn) throw new ValidationError('MRN is required');
    const prisma = getPrismaClient() as any;
    try {
      const patient = await prisma.patient.findUnique({
        where: { mrn },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              dob: true,
              gender: true,
              address: true
            }
          },
          appointments: true,
          prescriptions: true,
          vitalSigns: { orderBy: { recordedAt: 'desc' }, take: 1 }
        }
      });
      if (!patient) throw new NotFoundError(`Patient with MRN ${mrn} not found`);
      return patient;
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError(`Patient with MRN ${mrn} not found`);
    }
  },

  async updatePatientMedicalHistory(patientId: string, medicalHistory: string, allergies?: string[]) {
    if (!patientId) throw new ValidationError('Patient ID is required');
    const prisma = getPrismaClient() as any;
    try {
      const updated = await prisma.patient.update({
        where: { id: patientId },
        data: {
          medicalHistory,
          ...(allergies ? { allergies } : {})
        }
      });
      return updated;
    } catch (err) {
      throw new NotFoundError(`Failed to update medical history for patient ${patientId}`);
    }
  }
};
