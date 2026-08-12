import { getPrismaClient, validateRequiredFields, ValidationError, NotFoundError } from './hospitalServices.js';

export interface CreateBillInput {
  patientId: string;
  serviceType: string;
  totalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  dueDate?: string;
  notes?: string;
}

export interface RecordPaymentInput {
  billId: string;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'INSURANCE';
  transactionRef?: string;
}

export const billingService = {
  async getBills(patientId?: string) {
    const prisma = getPrismaClient();
    try {
      return await prisma.bill.findMany({
        where: patientId ? { patientId } : undefined,
        include: {
          patient: { include: { user: { select: { name: true, mrn: true } } } },
          payments: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (e) {
      return [];
    }
  },

  async createBill(input: CreateBillInput) {
    validateRequiredFields(input, ['patientId', 'serviceType', 'totalAmount']);
    const prisma = getPrismaClient();

    try {
      const discount = Number(input.discountAmount) || 0;
      const tax = Number(input.taxAmount) || 0;
      const net = Math.max(0, Number(input.totalAmount) - discount + tax);
      const billNo = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const dueDateStr = input.dueDate || new Date().toISOString().split('T')[0];

      const bill = await prisma.bill.create({
        data: {
          patientId: input.patientId,
          billNumber: billNo,
          totalAmount: Number(input.totalAmount),
          discountAmount: discount,
          taxAmount: tax,
          netAmount: net,
          status: 'UNPAID',
          serviceType: input.serviceType,
          dueDate: dueDateStr,
          notes: input.notes || ''
        }
      });
      return bill;
    } catch (err) {
      throw new ValidationError('Failed to create billing invoice');
    }
  },

  async recordPayment(input: RecordPaymentInput) {
    validateRequiredFields(input, ['billId', 'amount', 'paymentMethod']);
    const prisma = getPrismaClient();

    try {
      const bill = await prisma.bill.findUnique({ where: { id: input.billId }, include: { payments: true } });
      if (!bill) throw new NotFoundError(`Bill ${input.billId} not found`);

      const payNo = `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const payment = await prisma.payment.create({
        data: {
          billId: input.billId,
          paymentNumber: payNo,
          amount: Number(input.amount),
          paymentMethod: input.paymentMethod,
          paymentStatus: 'SUCCESS',
          transactionRef: input.transactionRef || `REF-${Date.now()}`
        }
      });

      const totalPaid = bill.payments.reduce((acc, p) => acc + p.amount, 0) + Number(input.amount);
      let newStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' = 'PARTIALLY_PAID';
      if (totalPaid >= bill.netAmount) {
        newStatus = 'PAID';
      }

      await prisma.bill.update({
        where: { id: input.billId },
        data: { status: newStatus }
      });

      return payment;
    } catch (err: any) {
      if (err instanceof NotFoundError) throw err;
      throw new ValidationError('Failed to process payment');
    }
  }
};
