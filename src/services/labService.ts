import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface CreateLabReportInput {
  patientId: string;
  doctorId: string;
  labTestId: string;
  orderDate?: string;
  testResults?: string;
  remarks?: string;
  isCritical?: boolean;
}

export const labService = {
  async getLabTestCatalog() {
    const prisma = getPrismaClient();
    try {
      return await prisma.labTest.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (e) {
      return [];
    }
  },

  async getLabReports(patientId?: string) {
    const prisma = getPrismaClient();
    try {
      return await prisma.labReport.findMany({
        where: patientId ? { patientId } : undefined,
        include: {
          patient: { include: { user: { select: { name: true, mrn: true } } } },
          doctor: { select: { name: true } },
          labTest: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async createLabReport(input: CreateLabReportInput) {
    validateRequiredFields(input, ['patientId', 'doctorId', 'labTestId']);
    const prisma = getPrismaClient();
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const report = await prisma.labReport.create({
        data: {
          patientId: input.patientId,
          doctorId: input.doctorId,
          labTestId: input.labTestId,
          orderDate: input.orderDate || todayStr,
          status: 'ORDERED',
          testResults: input.testResults || '',
          remarks: input.remarks || '',
          isCritical: !!input.isCritical
        },
        include: { labTest: true }
      });
      return report;
    } catch (err) {
      throw new ValidationError('Failed to order lab test');
    }
  },

  async updateLabReportResults(reportId: string, testResults: string, status: string, remarks?: string, isCritical?: boolean) {
    if (!reportId) throw new ValidationError('Report ID is required');
    const prisma = getPrismaClient();
    try {
      const nowStr = new Date().toLocaleString();
      return await prisma.labReport.update({
        where: { id: reportId },
        data: {
          testResults,
          status,
          remarks: remarks || '',
          isCritical: !!isCritical,
          resultDate: nowStr
        }
      });
    } catch (err) {
      throw new NotFoundError(`Lab report ${reportId} not found`);
    }
  }
};
