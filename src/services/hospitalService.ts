import {
  Department,
  Doctor,
  QueueToken,
  Appointment,
  PatientVital,
  PharmacyOrder,
  BillingInvoice,
  HospitalLocation,
  HospitalStats,
  PriorityLevel,
  TokenStatus,
  MedicalRecordsData,
  NotificationItem,
  PrescriptionItem,
  LabReportItem,
  NursingTask,
  MedicationTask,
  NursingNote,
  MedicineInventoryItem,
  SmartQueueItem,
  QueueDepartment,
  QueueItemPriority,
  QueueItemStatus
} from '../types';

export const hospitalService = {
  async getSmartQueue(department?: string, search?: string, mrn?: string): Promise<SmartQueueItem[]> {
    const query = new URLSearchParams();
    if (department) query.append('department', department);
    if (search) query.append('search', search);
    if (mrn) query.append('mrn', mrn);
    const res = await fetch(`/api/smart-queue?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch smart queue');
    return res.json();
  },

  async createSmartQueueItem(data: {
    department: QueueDepartment;
    patientName: string;
    mrn?: string;
    patientPhone?: string;
    serviceProvider?: string;
    priority?: QueueItemPriority;
    serviceDuration?: number;
    counterNumber?: string;
  }): Promise<SmartQueueItem> {
    const res = await fetch('/api/smart-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create queue item');
    return res.json();
  },

  async callNextSmartQueue(id?: string, department?: string, counterNumber?: string, serviceProvider?: string): Promise<{ message: string; token: SmartQueueItem }> {
    const targetUrl = id ? `/api/smart-queue/${id}/call-next` : '/api/smart-queue/next/call-next';
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, counterNumber, serviceProvider })
    });
    if (!res.ok) throw new Error('Failed to call next queue patient');
    return res.json();
  },

  async skipSmartQueue(id: string): Promise<{ message: string; token: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/skip`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to skip patient');
    return res.json();
  },

  async recallSmartQueue(id: string): Promise<{ message: string; token: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/recall`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to recall patient');
    return res.json();
  },

  async markInServiceSmartQueue(id: string): Promise<{ message: string; token: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/in-service`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark patient in service');
    return res.json();
  },

  async completeSmartQueue(id: string): Promise<{ message: string; token: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/complete`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to complete service');
    return res.json();
  },

  async markEmergencySmartQueue(id: string): Promise<{ message: string; token: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/emergency`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to mark emergency');
    return res.json();
  },

  async transferSmartQueue(id: string, targetDepartment: QueueDepartment, transferNotes?: string, serviceProvider?: string): Promise<{ message: string; sourceToken: SmartQueueItem; transferredToken: SmartQueueItem }> {
    const res = await fetch(`/api/smart-queue/${id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDepartment, transferNotes, serviceProvider })
    });
    if (!res.ok) throw new Error('Failed to transfer patient queue');
    return res.json();
  },
  async getStats(): Promise<HospitalStats> {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch hospital stats');
    return res.json();
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) throw new Error('Failed to fetch departments');
    return res.json();
  },

  async getDoctors(departmentId?: string): Promise<Doctor[]> {
    const url = departmentId ? `/api/doctors?departmentId=${departmentId}` : '/api/doctors';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },

  async getTokens(doctorId?: string, status?: string): Promise<QueueToken[]> {
    const query = new URLSearchParams();
    if (doctorId) query.append('doctorId', doctorId);
    if (status) query.append('status', status);
    const res = await fetch(`/api/tokens?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch queue tokens');
    return res.json();
  },

  async issueToken(data: {
    patientName: string;
    patientPhone: string;
    departmentId: string;
    doctorId: string;
    priority: PriorityLevel;
  }): Promise<QueueToken> {
    const res = await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to issue queue token');
    return res.json();
  },

  async updateTokenStatus(tokenId: string, status: TokenStatus, counterNumber?: string): Promise<QueueToken> {
    const res = await fetch(`/api/tokens/${tokenId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, counterNumber })
    });
    if (!res.ok) throw new Error('Failed to update token status');
    return res.json();
  },

  async getAppointments(): Promise<Appointment[]> {
    const res = await fetch('/api/appointments');
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return res.json();
  },

  async bookAppointment(data: {
    patientName: string;
    patientPhone: string;
    doctorId: string;
    date: string;
    timeSlot: string;
    type?: string;
    symptoms?: string;
  }): Promise<Appointment> {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to book appointment');
    return res.json();
  },

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update appointment');
    return res.json();
  },

  async cancelAppointment(id: string): Promise<{ message: string }> {
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to cancel appointment');
    return res.json();
  },

  async getMedicalRecords(mrn?: string): Promise<MedicalRecordsData> {
    const url = mrn ? `/api/medical-records?mrn=${mrn}` : '/api/medical-records';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch medical records');
    return res.json();
  },

  async getNotifications(mrn?: string): Promise<NotificationItem[]> {
    const url = mrn ? `/api/notifications?mrn=${mrn}` : '/api/notifications';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    return res.json();
  },

  async markNotificationRead(id: string): Promise<NotificationItem> {
    const res = await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to mark notification as read');
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ message: string }> {
    const res = await fetch('/api/notifications/mark-all-read', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to mark all notifications as read');
    return res.json();
  },

  async getVitals(): Promise<PatientVital[]> {
    const res = await fetch('/api/vitals');
    if (!res.ok) throw new Error('Failed to fetch patient vitals');
    return res.json();
  },

  async updateVitals(vitalId: string, updates: Partial<PatientVital>): Promise<PatientVital> {
    const res = await fetch(`/api/vitals/${vitalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update patient vitals');
    return res.json();
  },

  async getPharmacyOrders(): Promise<PharmacyOrder[]> {
    const res = await fetch('/api/pharmacy');
    if (!res.ok) throw new Error('Failed to fetch pharmacy orders');
    return res.json();
  },

  async verifyPharmacyOrder(orderId: string, pharmacistName?: string, notes?: string): Promise<PharmacyOrder> {
    const res = await fetch(`/api/pharmacy/verify/${orderId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pharmacistName, notes })
    });
    if (!res.ok) throw new Error('Failed to verify pharmacy order');
    return res.json();
  },

  async updatePharmacyStatus(
    orderId: string,
    status: 'WAITING' | 'VERIFIED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPENSED',
    pickupCounter?: string,
    notes?: string
  ): Promise<PharmacyOrder> {
    const res = await fetch(`/api/pharmacy/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, pickupCounter, notes })
    });
    if (!res.ok) throw new Error('Failed to update pharmacy status');
    return res.json();
  },

  async processExpressPickup(orderIdOrToken: string, verificationCode?: string): Promise<any> {
    const res = await fetch(`/api/pharmacy/express-pickup/${orderIdOrToken}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationCode })
    });
    if (!res.ok) throw new Error('Failed to process express pickup');
    return res.json();
  },

  async getPharmacyInventory(): Promise<{ inventory: MedicineInventoryItem[]; stats: { totalMedicines: number; lowStockCount: number; outOfStockCount: number } }> {
    const res = await fetch('/api/pharmacy/inventory');
    if (!res.ok) throw new Error('Failed to fetch pharmacy inventory');
    return res.json();
  },

  async createInventoryItem(data: Partial<MedicineInventoryItem>): Promise<MedicineInventoryItem> {
    const res = await fetch('/api/pharmacy/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create inventory item');
    return res.json();
  },

  async updateInventoryItem(id: string, data: Partial<MedicineInventoryItem>): Promise<MedicineInventoryItem> {
    const res = await fetch(`/api/pharmacy/inventory/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update inventory item');
    return res.json();
  },

  async getBillingInvoices(): Promise<{
    invoices: BillingInvoice[];
    stats: {
      waitingPatientsCount: number;
      processingBillsCount: number;
      completedBillsCount: number;
      avgWaitTimeMins: number;
      totalRevenue: number;
    };
  }> {
    const res = await fetch('/api/billing');
    if (!res.ok) throw new Error('Failed to fetch billing invoices');
    const data = await res.json();
    if (Array.isArray(data)) {
      // Fallback if returned as raw array
      const waiting = data.filter((i: any) => i.status === 'WAITING' || i.status === 'PENDING').length;
      const processing = data.filter((i: any) => i.status === 'PROCESSING').length;
      const completed = data.filter((i: any) => i.status === 'PAID').length;
      const revenue = data.filter((i: any) => i.status === 'PAID').reduce((s: number, i: any) => s + (i.amount || 0), 0);
      return {
        invoices: data,
        stats: {
          waitingPatientsCount: waiting,
          processingBillsCount: processing,
          completedBillsCount: completed,
          avgWaitTimeMins: 4,
          totalRevenue: revenue
        }
      };
    }
    return data;
  },

  async createBillingToken(data: {
    patientName: string;
    mrn: string;
    patientPhone?: string;
    serviceType?: string;
    consultationFee?: number;
    laboratoryCharges?: number;
    pharmacyCharges?: number;
    otherCharges?: number;
    isDischargeBill?: boolean;
    notes?: string;
  }): Promise<BillingInvoice> {
    const res = await fetch('/api/billing/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create billing token');
    return res.json();
  },

  async processBillingInvoice(id: string): Promise<BillingInvoice> {
    const res = await fetch(`/api/billing/process/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to process billing invoice');
    return res.json();
  },

  async payBillingInvoice(
    id: string,
    paymentMethod: 'UPI' | 'CARD' | 'CASH',
    paymentReference?: string
  ): Promise<{ message: string; invoice: BillingInvoice }> {
    const res = await fetch(`/api/billing/pay/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, paymentReference })
    });
    if (!res.ok) throw new Error('Failed to process payment');
    return res.json();
  },

  async sendBillingNotification(id: string, type: 'PENDING' | 'DISCHARGE'): Promise<any> {
    const res = await fetch(`/api/billing/notify/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    if (!res.ok) throw new Error('Failed to trigger billing notification');
    return res.json();
  },

  async getLocations(): Promise<HospitalLocation[]> {
    const res = await fetch('/api/locations');
    if (!res.ok) throw new Error('Failed to fetch hospital locations');
    return res.json();
  },

  async createPrescription(data: {
    mrn: string;
    patientName: string;
    doctorName?: string;
    departmentName?: string;
    diagnosis: string;
    medicines: Array<{ name: string; dosage: string; duration: string; instructions: string }>;
  }): Promise<PrescriptionItem> {
    const res = await fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create prescription');
    return res.json();
  },

  async createLabOrder(data: {
    mrn: string;
    patientName: string;
    testName: string;
    category?: string;
    orderedBy?: string;
    metricsSummary?: string;
  }): Promise<LabReportItem> {
    const res = await fetch('/api/lab-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to order lab test');
    return res.json();
  },

  async getStaffMessages(recipientRole?: string): Promise<any[]> {
    const url = recipientRole ? `/api/messages?recipientRole=${recipientRole}` : '/api/messages';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch staff messages');
    return res.json();
  },

  async sendStaffMessage(data: {
    senderRole?: string;
    senderName?: string;
    recipientRole: string;
    subject: string;
    message: string;
    priority?: string;
  }): Promise<any> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to send message');
    return res.json();
  },

  async getNursingTasks(): Promise<NursingTask[]> {
    const res = await fetch('/api/nursing-tasks');
    if (!res.ok) throw new Error('Failed to fetch nursing tasks');
    return res.json();
  },

  async createNursingTask(data: Partial<NursingTask>): Promise<NursingTask> {
    const res = await fetch('/api/nursing-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create nursing task');
    return res.json();
  },

  async updateNursingTask(id: string, data: Partial<NursingTask>): Promise<NursingTask> {
    const res = await fetch(`/api/nursing-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update nursing task');
    return res.json();
  },

  async getMedicationTasks(): Promise<MedicationTask[]> {
    const res = await fetch('/api/medication-tasks');
    if (!res.ok) throw new Error('Failed to fetch medication tasks');
    return res.json();
  },

  async updateMedicationTask(id: string, data: Partial<MedicationTask>): Promise<MedicationTask> {
    const res = await fetch(`/api/medication-tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update medication task');
    return res.json();
  },

  async getNursingNotes(): Promise<NursingNote[]> {
    const res = await fetch('/api/nursing-notes');
    if (!res.ok) throw new Error('Failed to fetch nursing notes');
    return res.json();
  },

  async createNursingNote(data: Partial<NursingNote>): Promise<NursingNote> {
    const res = await fetch('/api/nursing-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create nursing note');
    return res.json();
  }
};
