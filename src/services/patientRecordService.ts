import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface CreatePatientRecordInput {
  patientId: string;
  doctorId: string;
  recordType: 'CONSULTATION_NOTE' | 'DIAGNOSIS' | 'SURGERY' | 'ALLERGY_ALERT';
  title: string;
  description: string;
  clinicalNotes?: string;
  attachments?: string[];
}

export const patientRecordService = {
  async getPatientRecords(patientId: string) {
    if (!patientId) throw new ValidationError('Patient ID is required');
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.patientRecord.findMany({
        where: { patientId },
        include: {
          doctor: { select: { name: true, specialization: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async createRecord(input: CreatePatientRecordInput) {
    validateRequiredFields(input, ['patientId', 'doctorId', 'recordType', 'title', 'description']);
    const prisma = getPrismaClient() as any;
    try {
      return await prisma.patientRecord.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          recordType: input.recordType,
          title: input.title,
          description: input.description,
          clinicalNotes: input.clinicalNotes || '',
          attachments: input.attachments || []
        }
      });
    } catch (err) {
      throw new ValidationError('Failed to create clinical patient record');
    }
  }
};
