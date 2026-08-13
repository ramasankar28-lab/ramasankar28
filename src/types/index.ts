export type PriorityLevel = 'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY' | 'PREGNANT_OR_DISABLED';

export type TokenStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED';

export type VitalAlertStatus = 'STABLE' | 'WARNING' | 'CRITICAL';

export type CounterCategory = 'OPD' | 'PHARMACY' | 'BILLING' | 'LABORATORY' | 'RADIOLOGY' | 'REGISTRATION' | 'WARD' | 'EMERGENCY';

export type UserRole = 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ATTENDER' | 'PHARMACY';

export type QueueDepartment =
  | 'Registration'
  | 'General OPD'
  | 'Specialist OPD'
  | 'Laboratory'
  | 'Pharmacy'
  | 'Billing';

export type QueueItemStatus =
  | 'WAITING'
  | 'CALLING'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'EMERGENCY';

export type QueueItemPriority = 'Low' | 'Moderate' | 'High' | 'Critical';

export interface SmartQueueItem {
  id: string;
  department: QueueDepartment;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  patientPhone?: string;
  serviceProvider: string;
  status: QueueItemStatus;
  arrivalTime: string;
  startTime?: string;
  completionTime?: string;
  serviceDuration: number;
  priority: QueueItemPriority;
  queuePosition: number;
  estimatedWaitMinutes: number;
  counterNumber?: string;
  transferredFrom?: string;
  transferNotes?: string;
}

export interface MedicalHistoryItem {
  id: string;
  mrn: string;
  patientName: string;
  condition: string;
  diagnosedDate: string;
  status: 'ACTIVE' | 'RESOLVED' | 'UNDER_OBSERVATION';
  treatingDoctor: string;
  notes: string;
  allergies: string[];
  immunizations: string[];
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionNumber: string;
  mrn: string;
  patientName: string;
  doctorName: string;
  departmentName: string;
  date: string;
  medicines: PrescriptionMedicine[];
  diagnosis: string;
  status: 'PRESCRIBED' | 'DISPENSED' | 'COMPLETED';
}

export interface LabTestMetric {
  parameter: string;
  result: string;
  normalRange: string;
  status: 'NORMAL' | 'BORDERLINE' | 'MILD_HIGH' | 'HIGH' | 'CRITICAL';
}

export interface LabReportItem {
  id: string;
  reportNumber: string;
  mrn: string;
  patientName: string;
  testName: string;
  category: string;
  orderedBy: string;
  orderDate: string;
  completedDate?: string;
  status: 'ORDERED' | 'IN_ANALYSIS' | 'COMPLETED';
  resultsSummary: string;
  isCritical: boolean;
  fileUrl?: string;
  metrics: LabTestMetric[];
}

export interface MedicalRecordsData {
  history: MedicalHistoryItem[];
  prescriptions: PrescriptionItem[];
  labReports: LabReportItem[];
  previousAppointments: Appointment[];
}

export type NotificationCategory = 'APPOINTMENT' | 'TOKEN' | 'DOCTOR_DELAY' | 'LAB_REPORT' | 'PHARMACY' | 'BILLING';

export interface NotificationItem {
  id: string;
  mrn: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  mrn?: string;
  departmentId?: string;
  departmentName?: string;
  roomNumber?: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  wing: string;
  description: string;
  avgWaitTimeMinutes: number;
  activeQueueCount: number;
  iconName?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  departmentId: string;
  departmentName: string;
  roomNumber: string;
  isAvailable: boolean;
  maxDailyPatients: number;
  currentTokenNumber: number;
  totalTokensIssued: number;
  avgConsultationTimeMins: number;
  shiftStart: string;
  shiftEnd: string;
  activeNurseAssigned: string;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  phone: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  emergencyContact: string;
}

export interface QueueToken {
  id: string;
  tokenNumber: string;
  sequenceNo: number;
  priority: PriorityLevel;
  status: TokenStatus;
  estimatedWaitMinutes: number;
  issueTime: string;
  calledTime?: string;
  completedTime?: string;
  counterNumber: string;
  departmentId: string;
  departmentName: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  mrn: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  mrn: string;
  doctorName: string;
  doctorId: string;
  departmentName: string;
  date: string;
  timeSlot: string;
  type: 'OPD' | 'FOLLOW_UP' | 'TELE_CONSULT';
  status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  symptoms?: string;
}

export interface PatientVital {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  age: number;
  gender: string;
  bedNumber: string;
  ward: string;
  heartRate: number; // bpm
  bpSystolic: number;
  bpDiastolic: number;
  spO2: number; // percentage
  temperature: number; // °C
  respiratoryRate?: number; // breaths/min
  bloodGlucose?: number; // mg/dL
  alertStatus: VitalAlertStatus;
  nurseAssigned: string;
  lastUpdated: string;
  notes?: string;
}

export interface NursingTask {
  id: string;
  patientName: string;
  mrn: string;
  bedNumber: string;
  title: string;
  description: string;
  category: 'VITAL_CHECK' | 'MEDICATION' | 'DRESSING' | 'LAB_SAMPLE' | 'IV_DRIP' | 'OTHER';
  isUrgent: boolean;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  dueTime: string;
  assignedNurse: string;
}

export interface MedicationTask {
  id: string;
  patientName: string;
  mrn: string;
  bedNumber: string;
  medicineName: string;
  dose: string;
  route: string;
  scheduledTime: string;
  status: 'SCHEDULED' | 'ADMINISTERED' | 'OVERDUE' | 'SKIPPED';
  administeredAt?: string;
  administeredBy?: string;
}

export interface NursingNote {
  id: string;
  patientName: string;
  mrn: string;
  bedNumber: string;
  nurseName: string;
  category: 'SOAP_SUBJECTIVE' | 'CARE_PLAN' | 'OBSERVATION' | 'SHIFT_HANDOVER';
  note: string;
  timestamp: string;
}

export interface NurseShift {
  shiftName: string;
  startTime: string;
  endTime: string;
  assignedWard: string;
  assignedNurseName: string;
  assignedPatientsCount: number;
}

export interface HospitalLocation {
  id: string;
  name: string;
  category: CounterCategory | 'AMENITY' | 'CLINICAL' | 'ENTRY' | 'WARD';
  floor: string;
  wing: string;
  x: number;
  y: number;
  description?: string;
  directionSteps: string[];
  queueWaitMins: number;
  activeCounters: number;
  openHours: string;
  openStatus?: 'OPEN_24_7' | 'OPEN_NOW' | 'CLOSING_SOON' | 'CLOSED';
  crowdLevel?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  doctorsList?: string[];
  servicesOffered?: string[];
  contactExt?: string;
  phone?: string;
  iconName?: string;
}

export interface PharmacyOrder {
  id: string;
  orderNumber: string;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  prescribedBy: string;
  itemsCount: number;
  medicines: string[];
  status: 'WAITING' | 'VERIFIED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DISPENSED';
  pickupCounter: string;
  patientsAhead: number;
  estimatedTimeMins: number;
  issuedAt: string;
  isExpressPickup?: boolean;
  qrCode?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface MedicineInventoryItem {
  id: string;
  name: string;
  category: string;
  dosageForm: string;
  strength: string;
  stockQuantity: number;
  minStockLevel: number;
  expiryDate: string;
  pricePerUnit: number;
  locationRack: string;
  availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface BillingChargeBreakdown {
  consultationFee: number;
  laboratoryCharges: number;
  pharmacyCharges: number;
  otherCharges: number;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  tokenNumber: string;
  patientName: string;
  mrn: string;
  patientPhone?: string;
  serviceType: string;
  consultationFee: number;
  laboratoryCharges: number;
  pharmacyCharges: number;
  otherCharges: number;
  amount: number;
  status: 'WAITING' | 'PROCESSING' | 'PENDING' | 'PAID' | 'INSURANCE_PROCESSING';
  counter: string;
  patientsAhead: number;
  estimatedTimeMins: number;
  issuedAt: string;
  dueDate: string;
  paymentMethod?: 'UPI' | 'CARD' | 'CASH';
  paymentReference?: string;
  paidAt?: string;
  receiptNumber?: string;
  isDischargeBill?: boolean;
  notes?: string;
}

export interface HospitalStats {
  totalPatientsToday: number;
  activeOPDQueue: number;
  avgWaitTimeMins: number;
  doctorsActive: number;
  nursesOnShift: number;
  criticalAlerts: number;
  bedsOccupancyRate: number;
  queueReductionPercent: number;
}
