import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const PORT = 3000;

// ==================== AUTHENTICATION & SECURITY ENGINE ====================

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export type UserRole = 'ADMIN' | 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ATTENDER' | 'PHARMACY';

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
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

const usersDatabase: UserAccount[] = [];

function seedDemoUser(
  email: string,
  pass: string,
  name: string,
  role: UserRole,
  extra: Partial<UserAccount> = {}
) {
  const salt = generateSalt();
  const passwordHash = hashPassword(pass, salt);
  const user: UserAccount = {
    id: `usr-${role.toLowerCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    email: email.toLowerCase(),
    name,
    role,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
    ...extra
  };
  usersDatabase.push(user);
  return user;
}

// Pre-seed Demo Accounts for all 6 roles
seedDemoUser('admin@smarthospital.org', 'Admin@123', 'Administrator Console', 'ADMIN', {
  phone: '+1 (555) 000-1111'
});

seedDemoUser('patient@smarthospital.org', 'Patient@123', 'David Miller', 'PATIENT', {
  phone: '+1 (555) 234-5678',
  mrn: 'MRN-2026-8812',
  dob: '1988-05-14',
  gender: 'Male',
  address: '452 Medical Parkway, Suite 4B',
  emergencyContactName: 'Sarah Miller',
  emergencyContactPhone: '+1 (555) 999-8888',
  emergencyContactRelation: 'Spouse'
});

seedDemoUser('doctor@smarthospital.org', 'Doctor@123', 'Dr. Aris Vance, MD', 'DOCTOR', {
  phone: '+1 (555) 111-2222',
  departmentId: 'dept-1',
  departmentName: 'General Medicine & OPD',
  roomNumber: 'Room 102'
});

seedDemoUser('nurse@smarthospital.org', 'Nurse@123', 'Nurse Elena Rostova', 'NURSE', {
  phone: '+1 (555) 333-4444',
  departmentName: 'Ward Alpha - Station 1'
});

seedDemoUser('attender@smarthospital.org', 'Attender@123', 'Robert Martinez (Attender)', 'ATTENDER', {
  phone: '+1 (555) 555-6666',
  mrn: 'MRN-2026-8812'
});

seedDemoUser('pharmacy@smarthospital.org', 'Pharmacy@123', 'Chief Pharmacist Sanjeev', 'PHARMACY', {
  phone: '+1 (555) 777-8888',
  roomNumber: 'Counter #2'
});

// Active Session Management Map (token -> session)
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

function createSession(userId: string): string {
  const token = `sess-${crypto.randomUUID()}`;
  // Session expires in 24 hours
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

function sanitizeUser(user: UserAccount) {
  const { passwordHash, salt, ...sanitized } = user;
  return sanitized;
}

// ==================== IN-MEMORY DEMO DATABASE ====================

const departments = [
  { id: 'dept-1', name: 'General Medicine & OPD', code: 'GM-OPD', floor: 'Ground Floor', wing: 'Block A', description: 'Primary health checks, adult medicine, fever, routine OPD consultations.', avgWaitTimeMinutes: 12, activeQueueCount: 14, iconName: 'Stethoscope' },
  { id: 'dept-2', name: 'Cardiology & Vascular', code: 'CARD', floor: '1st Floor', wing: 'Block B', description: 'Heart care, ECG, echo, hypertension, angina, cardiac checkups.', avgWaitTimeMinutes: 20, activeQueueCount: 8, iconName: 'HeartPulse' },
  { id: 'dept-3', name: 'Pediatric & Child Care', code: 'PED', floor: '1st Floor', wing: 'Block C', description: 'Infant, child health, vaccination, pediatric emergencies.', avgWaitTimeMinutes: 10, activeQueueCount: 6, iconName: 'Baby' },
  { id: 'dept-4', name: 'Orthopedics & Joint Care', code: 'ORTHO', floor: '2nd Floor', wing: 'Block A', description: 'Fractures, joint pains, bone care, trauma & spine OPD.', avgWaitTimeMinutes: 18, activeQueueCount: 11, iconName: 'Activity' },
  { id: 'dept-5', name: 'Dermatology & Skin', code: 'DERM', floor: '2nd Floor', wing: 'Block B', description: 'Skin disorders, allergies, cosmetic consultations.', avgWaitTimeMinutes: 15, activeQueueCount: 5, iconName: 'Sparkles' },
  { id: 'dept-6', name: 'ENT & Head-Neck', code: 'ENT', floor: '3rd Floor', wing: 'Block A', description: 'Ear, nose, throat consultations, audiometry, sinus care.', avgWaitTimeMinutes: 14, activeQueueCount: 7, iconName: 'Ear' },
];

let doctors = [
  { id: 'doc-1', name: 'Dr. Aris Vance, MD', specialization: 'Senior General Physician', departmentId: 'dept-1', departmentName: 'General Medicine & OPD', roomNumber: 'Room 102', isAvailable: true, maxDailyPatients: 35, currentTokenNumber: 104, totalTokensIssued: 28, avgConsultationTimeMins: 8, shiftStart: '08:30 AM', shiftEnd: '02:30 PM', activeNurseAssigned: 'Nurse Elena Rostova' },
  { id: 'doc-2', name: 'Dr. Sarah Jenkins, MD', specialization: 'Interventional Cardiologist', departmentId: 'dept-2', departmentName: 'Cardiology & Vascular', roomNumber: 'Room 205', isAvailable: true, maxDailyPatients: 25, currentTokenNumber: 202, totalTokensIssued: 19, avgConsultationTimeMins: 15, shiftStart: '09:00 AM', shiftEnd: '04:00 PM', activeNurseAssigned: 'Nurse Priya Sharma' },
  { id: 'doc-3', name: 'Dr. Michael Chen, DCH', specialization: 'Consultant Pediatrician', departmentId: 'dept-3', departmentName: 'Pediatric & Child Care', roomNumber: 'Room 110', isAvailable: true, maxDailyPatients: 30, currentTokenNumber: 301, totalTokensIssued: 15, avgConsultationTimeMins: 10, shiftStart: '08:00 AM', shiftEnd: '03:00 PM', activeNurseAssigned: 'Nurse Marcus Lee' },
  { id: 'doc-4', name: 'Dr. Rajesh Nair, MS (Ortho)', specialization: 'Orthopedic Surgeon', departmentId: 'dept-4', departmentName: 'Orthopedics & Joint Care', roomNumber: 'Room 214', isAvailable: true, maxDailyPatients: 28, currentTokenNumber: 403, totalTokensIssued: 22, avgConsultationTimeMins: 12, shiftStart: '10:00 AM', shiftEnd: '05:00 PM', activeNurseAssigned: 'Nurse Anita Gupta' },
  { id: 'doc-5', name: 'Dr. Emily Watson, MD', specialization: 'Dermatology Specialist', departmentId: 'dept-5', departmentName: 'Dermatology & Skin', roomNumber: 'Room 220', isAvailable: false, maxDailyPatients: 20, currentTokenNumber: 501, totalTokensIssued: 12, avgConsultationTimeMins: 10, shiftStart: '11:00 AM', shiftEnd: '04:00 PM', activeNurseAssigned: 'Nurse Sarah Connor' },
  { id: 'doc-6', name: 'Dr. David Miller, MS (ENT)', specialization: 'ENT Consultant', departmentId: 'dept-6', departmentName: 'ENT & Head-Neck', roomNumber: 'Room 304', isAvailable: true, maxDailyPatients: 25, currentTokenNumber: 602, totalTokensIssued: 16, avgConsultationTimeMins: 9, shiftStart: '09:00 AM', shiftEnd: '03:30 PM', activeNurseAssigned: 'Nurse Kevin Patel' },
];

let queueTokens = [
  {
    id: 'tok-101',
    tokenNumber: 'A-101',
    sequenceNo: 1,
    priority: 'EMERGENCY',
    status: 'IN_CONSULTATION',
    estimatedWaitMinutes: 0,
    issueTime: '09:10 AM',
    calledTime: '09:30 AM',
    counterNumber: 'Room 102',
    departmentId: 'dept-1',
    departmentName: 'General Medicine & OPD',
    doctorId: 'doc-1',
    doctorName: 'Dr. Aris Vance, MD',
    patientId: 'pat-001',
    patientName: 'David Miller',
    patientPhone: '+1 (555) 234-5678',
    mrn: 'MRN-2026-8812'
  },
  {
    id: 'tok-102',
    tokenNumber: 'A-102',
    sequenceNo: 2,
    priority: 'SENIOR_CITIZEN',
    status: 'WAITING',
    estimatedWaitMinutes: 5,
    issueTime: '09:15 AM',
    counterNumber: 'Room 102',
    departmentId: 'dept-1',
    departmentName: 'General Medicine & OPD',
    doctorId: 'doc-1',
    doctorName: 'Dr. Aris Vance, MD',
    patientId: 'pat-002',
    patientName: 'Eleanor Vance',
    patientPhone: '+1 (555) 345-6789',
    mrn: 'MRN-2026-9011'
  },
  {
    id: 'tok-103',
    tokenNumber: 'A-103',
    sequenceNo: 3,
    priority: 'NORMAL',
    status: 'WAITING',
    estimatedWaitMinutes: 12,
    issueTime: '09:22 AM',
    counterNumber: 'Room 102',
    departmentId: 'dept-1',
    departmentName: 'General Medicine & OPD',
    doctorId: 'doc-1',
    doctorName: 'Dr. Aris Vance, MD',
    patientId: 'pat-003',
    patientName: 'Robert Martinez',
    patientPhone: '+1 (555) 456-7890',
    mrn: 'MRN-2026-4432'
  },
  {
    id: 'tok-104',
    tokenNumber: 'A-104',
    sequenceNo: 4,
    priority: 'NORMAL',
    status: 'WAITING',
    estimatedWaitMinutes: 20,
    issueTime: '09:35 AM',
    counterNumber: 'Room 102',
    departmentId: 'dept-1',
    departmentName: 'General Medicine & OPD',
    doctorId: 'doc-1',
    doctorName: 'Dr. Aris Vance, MD',
    patientId: 'pat-004',
    patientName: 'Sophia Williams',
    patientPhone: '+1 (555) 567-8901',
    mrn: 'MRN-2026-1190'
  },
  {
    id: 'tok-201',
    tokenNumber: 'C-201',
    sequenceNo: 1,
    priority: 'NORMAL',
    status: 'IN_CONSULTATION',
    estimatedWaitMinutes: 0,
    issueTime: '09:00 AM',
    calledTime: '09:15 AM',
    counterNumber: 'Room 205',
    departmentId: 'dept-2',
    departmentName: 'Cardiology & Vascular',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Jenkins, MD',
    patientId: 'pat-005',
    patientName: 'James Anderson',
    patientPhone: '+1 (555) 678-9012',
    mrn: 'MRN-2026-3382'
  },
  {
    id: 'tok-202',
    tokenNumber: 'C-202',
    sequenceNo: 2,
    priority: 'SENIOR_CITIZEN',
    status: 'WAITING',
    estimatedWaitMinutes: 10,
    issueTime: '09:20 AM',
    counterNumber: 'Room 205',
    departmentId: 'dept-2',
    departmentName: 'Cardiology & Vascular',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Jenkins, MD',
    patientId: 'pat-006',
    patientName: 'Martha Stewart',
    patientPhone: '+1 (555) 789-0123',
    mrn: 'MRN-2026-6671'
  }
];

let appointments = [
  {
    id: 'apt-501',
    patientName: 'Clara Bennett',
    patientPhone: '+1 (555) 901-2345',
    mrn: 'MRN-2026-5521',
    doctorId: 'doc-1',
    doctorName: 'Dr. Aris Vance, MD',
    departmentName: 'General Medicine & OPD',
    date: '2026-08-12',
    timeSlot: '10:30 AM',
    type: 'OPD',
    status: 'CONFIRMED',
    symptoms: 'Persistent fever and fatigue for 3 days'
  },
  {
    id: 'apt-502',
    patientName: 'Henry Zhang',
    patientPhone: '+1 (555) 123-9876',
    mrn: 'MRN-2026-7743',
    doctorId: 'doc-2',
    doctorName: 'Dr. Sarah Jenkins, MD',
    departmentName: 'Cardiology & Vascular',
    date: '2026-08-12',
    timeSlot: '11:15 AM',
    type: 'FOLLOW_UP',
    status: 'CONFIRMED',
    symptoms: 'Post-stent hypertension follow-up'
  },
  {
    id: 'apt-503',
    patientName: 'Lucas Brown',
    patientPhone: '+1 (555) 432-1098',
    mrn: 'MRN-2026-2219',
    doctorId: 'doc-3',
    doctorName: 'Dr. Michael Chen, DCH',
    departmentName: 'Pediatric & Child Care',
    date: '2026-08-12',
    timeSlot: '11:45 AM',
    type: 'OPD',
    status: 'CONFIRMED',
    symptoms: 'Child 6-month vaccination schedule'
  }
];

let patientVitals = [
  {
    id: 'vit-1',
    patientId: 'pat-101',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    age: 68,
    gender: 'Male',
    bedNumber: 'ICU Bed 04',
    ward: 'Critical Care Unit',
    heartRate: 112,
    bpSystolic: 145,
    bpDiastolic: 92,
    spO2: 91,
    temperature: 38.4,
    respiratoryRate: 24,
    bloodGlucose: 168,
    alertStatus: 'CRITICAL',
    nurseAssigned: 'Nurse Elena Rostova',
    lastUpdated: '2 mins ago',
    notes: 'Oxygen saturation dropped below 92%. High temperature.'
  },
  {
    id: 'vit-2',
    patientId: 'pat-102',
    patientName: 'Beatrix Thorne',
    mrn: 'MRN-2026-3302',
    age: 54,
    gender: 'Female',
    bedNumber: 'Ward 2-B Bed 12',
    ward: 'Post-Operative Ward',
    heartRate: 84,
    bpSystolic: 128,
    bpDiastolic: 82,
    spO2: 97,
    temperature: 37.1,
    respiratoryRate: 16,
    bloodGlucose: 112,
    alertStatus: 'STABLE',
    nurseAssigned: 'Nurse Priya Sharma',
    lastUpdated: '5 mins ago',
    notes: 'Post-op recovery proceeding smoothly.'
  },
  {
    id: 'vit-3',
    patientId: 'pat-103',
    patientName: 'George Sterling',
    mrn: 'MRN-2026-8820',
    age: 72,
    gender: 'Male',
    bedNumber: 'Ward 1-A Bed 05',
    ward: 'Cardiology Observation',
    heartRate: 98,
    bpSystolic: 138,
    bpDiastolic: 88,
    spO2: 94,
    temperature: 37.5,
    respiratoryRate: 20,
    bloodGlucose: 142,
    alertStatus: 'WARNING',
    nurseAssigned: 'Nurse Marcus Lee',
    lastUpdated: '1 min ago',
    notes: 'Mild tachycardia observed post medication.'
  },
  {
    id: 'vit-4',
    patientId: 'pat-104',
    patientName: 'Maria Garcia',
    mrn: 'MRN-2026-4491',
    age: 39,
    gender: 'Female',
    bedNumber: 'Ward 3-C Bed 08',
    ward: 'Maternity & Gynecology',
    heartRate: 76,
    bpSystolic: 118,
    bpDiastolic: 76,
    spO2: 99,
    temperature: 36.8,
    respiratoryRate: 15,
    bloodGlucose: 98,
    alertStatus: 'STABLE',
    nurseAssigned: 'Nurse Anita Gupta',
    lastUpdated: '10 mins ago',
    notes: 'Normal vital checks.'
  }
];

let nursingTasks = [
  {
    id: 'ntask-1',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    bedNumber: 'ICU Bed 04',
    title: 'Stat SpO2 Nebulization & Arterial Blood Gas',
    description: 'Administer 5mg Salbutamol Nebulization and monitor SpO2 levels continuously.',
    category: 'VITAL_CHECK',
    isUrgent: true,
    status: 'PENDING',
    dueTime: '11:15 AM',
    assignedNurse: 'Nurse Elena Rostova'
  },
  {
    id: 'ntask-2',
    patientName: 'Beatrix Thorne',
    mrn: 'MRN-2026-3302',
    bedNumber: 'Ward 2-B Bed 12',
    title: 'Post-Op Surgical Dressing Change',
    description: 'Inspect abdominal incision site, sanitize with Betadine, apply sterile gauze dressing.',
    category: 'DRESSING',
    isUrgent: false,
    status: 'PENDING',
    dueTime: '11:30 AM',
    assignedNurse: 'Nurse Elena Rostova'
  },
  {
    id: 'ntask-3',
    patientName: 'George Sterling',
    mrn: 'MRN-2026-8820',
    bedNumber: 'Ward 1-A Bed 05',
    title: '12-Lead ECG & Cardiac Marker Blood Draw',
    description: 'Draw 5ml blood sample for Troponin I test and transmit to Pathology Lab.',
    category: 'LAB_SAMPLE',
    isUrgent: true,
    status: 'OVERDUE',
    dueTime: '10:15 AM',
    assignedNurse: 'Nurse Elena Rostova'
  },
  {
    id: 'ntask-4',
    patientName: 'Maria Garcia',
    mrn: 'MRN-2026-4491',
    bedNumber: 'Ward 3-C Bed 08',
    title: 'Routine Blood Glucose Monitoring',
    description: 'Check postprandial blood glucose using glucometer.',
    category: 'VITAL_CHECK',
    isUrgent: false,
    status: 'COMPLETED',
    dueTime: '09:00 AM',
    assignedNurse: 'Nurse Elena Rostova'
  }
];

let medicationTasks = [
  {
    id: 'medt-1',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    bedNumber: 'ICU Bed 04',
    medicineName: 'IV Furosemide (Lasix)',
    dose: '40 mg',
    route: 'IV Bolus',
    scheduledTime: '11:00 AM',
    status: 'SCHEDULED'
  },
  {
    id: 'medt-2',
    patientName: 'Beatrix Thorne',
    mrn: 'MRN-2026-3302',
    bedNumber: 'Ward 2-B Bed 12',
    medicineName: 'Oral Acetaminophen (Tylenol)',
    dose: '1000 mg',
    route: 'Oral',
    scheduledTime: '11:30 AM',
    status: 'SCHEDULED'
  },
  {
    id: 'medt-3',
    patientName: 'George Sterling',
    mrn: 'MRN-2026-8820',
    bedNumber: 'Ward 1-A Bed 05',
    medicineName: 'Clopidogrel (Plavix)',
    dose: '75 mg',
    route: 'Oral',
    scheduledTime: '10:15 AM',
    status: 'OVERDUE'
  },
  {
    id: 'medt-4',
    patientName: 'Maria Garcia',
    mrn: 'MRN-2026-4491',
    bedNumber: 'Ward 3-C Bed 08',
    medicineName: 'Prenatal Multivitamin + Iron',
    dose: '1 Tablet',
    route: 'Oral',
    scheduledTime: '09:00 AM',
    status: 'ADMINISTERED',
    administeredAt: '09:05 AM',
    administeredBy: 'Nurse Elena Rostova'
  }
];

let nursingNotes = [
  {
    id: 'nnote-1',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    bedNumber: 'ICU Bed 04',
    nurseName: 'Nurse Elena Rostova',
    category: 'SOAP_SUBJECTIVE',
    note: 'Patient complaining of dyspnea and chills. O2 therapy initiated at 4L/min via nasal cannula. Dr. Vance alerted.',
    timestamp: '10:30 AM'
  },
  {
    id: 'nnote-2',
    patientName: 'Beatrix Thorne',
    mrn: 'MRN-2026-3302',
    bedNumber: 'Ward 2-B Bed 12',
    nurseName: 'Nurse Elena Rostova',
    category: 'CARE_PLAN',
    note: 'Surgical site clean and dry. Patient ambulated 50 meters with assistance. Pain scale 3/10.',
    timestamp: '09:45 AM'
  }
];

let medicineInventory = [
  { id: 'med-1', name: 'Amoxicillin Trihydrate', category: 'Antibiotics', dosageForm: 'Capsule', strength: '500mg', stockQuantity: 420, minStockLevel: 100, expiryDate: '2027-05-15', pricePerUnit: 12.50, locationRack: 'Rack A-04', availability: 'IN_STOCK' },
  { id: 'med-2', name: 'Paracetamol / Acetaminophen', category: 'Analgesic & Fever', dosageForm: 'Tablet', strength: '650mg', stockQuantity: 1200, minStockLevel: 300, expiryDate: '2028-01-20', pricePerUnit: 2.00, locationRack: 'Rack A-01', availability: 'IN_STOCK' },
  { id: 'med-3', name: 'Atorvastatin Calcium', category: 'Cardiovascular & Lipids', dosageForm: 'Tablet', strength: '20mg', stockQuantity: 85, minStockLevel: 100, expiryDate: '2026-11-30', pricePerUnit: 18.00, locationRack: 'Rack B-12', availability: 'LOW_STOCK' },
  { id: 'med-4', name: 'Metformin Hydrochloride', category: 'Antidiabetic', dosageForm: 'SR Tablet', strength: '500mg', stockQuantity: 650, minStockLevel: 150, expiryDate: '2027-09-10', pricePerUnit: 8.50, locationRack: 'Rack C-02', availability: 'IN_STOCK' },
  { id: 'med-5', name: 'Salbutamol Inhaler (Ventolin)', category: 'Respiratory & Asthma', dosageForm: 'Inhaler', strength: '100mcg/dose', stockQuantity: 0, minStockLevel: 25, expiryDate: '2026-12-01', pricePerUnit: 45.00, locationRack: 'Rack D-08', availability: 'OUT_OF_STOCK' },
  { id: 'med-6', name: 'Azithromycin Dihydrate', category: 'Antibiotics', dosageForm: 'Tablet', strength: '500mg', stockQuantity: 18, minStockLevel: 50, expiryDate: '2026-10-15', pricePerUnit: 22.00, locationRack: 'Rack A-06', availability: 'LOW_STOCK' },
  { id: 'med-7', name: 'Pantoprazole Sodium', category: 'GI & Antacid', dosageForm: 'EC Tablet', strength: '40mg', stockQuantity: 520, minStockLevel: 120, expiryDate: '2027-08-25', pricePerUnit: 9.00, locationRack: 'Rack C-08', availability: 'IN_STOCK' },
  { id: 'med-8', name: 'Amlodipine Besylate', category: 'Cardiovascular & BP', dosageForm: 'Tablet', strength: '5mg', stockQuantity: 340, minStockLevel: 80, expiryDate: '2027-12-10', pricePerUnit: 6.50, locationRack: 'Rack B-03', availability: 'IN_STOCK' },
  { id: 'med-9', name: 'Insulin Glargine Pen (Lantus)', category: 'Antidiabetic', dosageForm: 'Pre-filled Pen', strength: '100 units/ml', stockQuantity: 0, minStockLevel: 15, expiryDate: '2026-09-30', pricePerUnit: 120.00, locationRack: 'Cold Storage Ref #1', availability: 'OUT_OF_STOCK' },
  { id: 'med-10', name: 'Cough Expectorant Syrup', category: 'Respiratory', dosageForm: 'Syrup', strength: '100ml', stockQuantity: 210, minStockLevel: 40, expiryDate: '2027-03-18', pricePerUnit: 15.00, locationRack: 'Rack D-02', availability: 'IN_STOCK' }
];

let pharmacyOrders = [
  {
    id: 'phm-1',
    orderNumber: 'RX-8821',
    tokenNumber: 'P-101',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-9011',
    prescribedBy: 'Dr. Aris Vance, MD',
    itemsCount: 3,
    medicines: ['Amoxicillin 500mg', 'Paracetamol 650mg', 'Multivitamin Syrup'],
    status: 'READY_FOR_PICKUP',
    pickupCounter: 'Express Counter #2',
    patientsAhead: 0,
    estimatedTimeMins: 0,
    issuedAt: '09:25 AM',
    isExpressPickup: true,
    qrCode: 'PHARM-QR-8821',
    verifiedBy: 'Chief Pharmacist Sanjeev',
    verifiedAt: '09:28 AM',
    notes: 'Single item fast-track dispense order.'
  },
  {
    id: 'phm-2',
    orderNumber: 'RX-8822',
    tokenNumber: 'P-102',
    patientName: 'James Anderson',
    mrn: 'MRN-2026-3382',
    prescribedBy: 'Dr. Sarah Jenkins, MD',
    itemsCount: 2,
    medicines: ['Atorvastatin 20mg', 'Aspirin 75mg'],
    status: 'PREPARING',
    pickupCounter: 'Pharmacy Counter #1',
    patientsAhead: 1,
    estimatedTimeMins: 5,
    issuedAt: '09:30 AM',
    isExpressPickup: false,
    qrCode: 'PHARM-QR-8822',
    verifiedBy: 'Chief Pharmacist Sanjeev',
    verifiedAt: '09:32 AM',
    notes: 'Verify stat lipid panel contraindications.'
  },
  {
    id: 'phm-3',
    orderNumber: 'RX-8823',
    tokenNumber: 'P-100',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    prescribedBy: 'Dr. Aris Vance, MD',
    itemsCount: 1,
    medicines: ['Cough Expectorant Syrup 100ml'],
    status: 'DISPENSED',
    pickupCounter: 'Express Counter #2',
    patientsAhead: 0,
    estimatedTimeMins: 0,
    issuedAt: '09:10 AM',
    isExpressPickup: true,
    qrCode: 'PHARM-QR-8823',
    verifiedBy: 'Chief Pharmacist Sanjeev',
    verifiedAt: '09:12 AM',
    notes: 'Handed over to patient attender.'
  },
  {
    id: 'phm-4',
    orderNumber: 'RX-8824',
    tokenNumber: 'P-103',
    patientName: 'Sophia Williams',
    mrn: 'MRN-2026-1190',
    prescribedBy: 'Dr. Michael Chen, DCH',
    itemsCount: 2,
    medicines: ['Amoxicillin Syrup 125mg/5ml', 'Paracetamol Syrup 120mg/5ml'],
    status: 'WAITING',
    pickupCounter: 'Pharmacy Counter #1',
    patientsAhead: 2,
    estimatedTimeMins: 10,
    issuedAt: '09:40 AM',
    isExpressPickup: false,
    qrCode: 'PHARM-QR-8824',
    notes: 'Pediatric liquid formulation weight-based check.'
  },
  {
    id: 'phm-5',
    orderNumber: 'RX-8825',
    tokenNumber: 'P-104',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    prescribedBy: 'Dr. Sarah Jenkins, MD',
    itemsCount: 3,
    medicines: ['Furosemide 40mg', 'Pantoprazole 40mg', 'Potassium Chloride Supp'],
    status: 'VERIFIED',
    pickupCounter: 'Pharmacy Counter #2',
    patientsAhead: 1,
    estimatedTimeMins: 7,
    issuedAt: '09:45 AM',
    isExpressPickup: false,
    qrCode: 'PHARM-QR-8825',
    verifiedBy: 'Pharmacist Rita',
    verifiedAt: '09:48 AM',
    notes: 'ICU discharge prescription verified.'
  }
];

let billingInvoices = [
  {
    id: 'inv-901',
    invoiceNumber: 'INV-2026-0041',
    tokenNumber: 'B-201',
    patientName: 'Sophia Williams',
    mrn: 'MRN-2026-1190',
    patientPhone: '+1 555-019-2831',
    serviceType: 'Pediatric OPD Consultation & Blood Profile',
    consultationFee: 40.00,
    laboratoryCharges: 35.00,
    pharmacyCharges: 25.00,
    otherCharges: 15.00,
    amount: 115.00,
    status: 'WAITING',
    counter: 'Billing Desk #1',
    patientsAhead: 2,
    estimatedTimeMins: 6,
    issuedAt: '09:42 AM',
    dueDate: '2026-08-12',
    isDischargeBill: false,
    notes: 'Pediatric consultation and stat CBC lab panel clearance.'
  },
  {
    id: 'inv-902',
    invoiceNumber: 'INV-2026-0042',
    tokenNumber: 'B-202',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-9011',
    patientPhone: '+1 555-014-9922',
    serviceType: 'General OPD & Antibiotics Package',
    consultationFee: 50.00,
    laboratoryCharges: 0.00,
    pharmacyCharges: 45.00,
    otherCharges: 10.00,
    amount: 105.00,
    status: 'PROCESSING',
    counter: 'Billing Desk #2 / Express Kiosk',
    patientsAhead: 1,
    estimatedTimeMins: 3,
    issuedAt: '09:35 AM',
    dueDate: '2026-08-12',
    isDischargeBill: false,
    notes: 'Processing insurance co-pay discount.'
  },
  {
    id: 'inv-903',
    invoiceNumber: 'INV-2026-0043',
    tokenNumber: 'B-200',
    patientName: 'Robert Martinez',
    mrn: 'MRN-2026-4432',
    patientPhone: '+1 555-018-4411',
    serviceType: 'Cardiology OPD & ECG Screening',
    consultationFee: 60.00,
    laboratoryCharges: 40.00,
    pharmacyCharges: 30.00,
    otherCharges: 20.00,
    amount: 150.00,
    status: 'PAID',
    counter: 'UPI Express Counter #1',
    patientsAhead: 0,
    estimatedTimeMins: 0,
    issuedAt: '09:15 AM',
    dueDate: '2026-08-12',
    paymentMethod: 'UPI',
    paymentReference: 'UPI/9982310129@ybl',
    paidAt: '09:20 AM',
    receiptNumber: 'REC-2026-8801',
    isDischargeBill: false,
    notes: 'Paid via instant UPI app scan.'
  },
  {
    id: 'inv-904',
    invoiceNumber: 'INV-2026-0044',
    tokenNumber: 'B-199',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    patientPhone: '+1 555-012-7723',
    serviceType: 'IPD Discharge Clearance (Room 204)',
    consultationFee: 150.00,
    laboratoryCharges: 180.00,
    pharmacyCharges: 220.00,
    otherCharges: 300.00,
    amount: 850.00,
    status: 'PENDING',
    counter: 'Discharge & Inpatient Billing Desk',
    patientsAhead: 0,
    estimatedTimeMins: 2,
    issuedAt: '09:50 AM',
    dueDate: '2026-08-12',
    isDischargeBill: true,
    notes: 'Discharge summary signed by Dr. Sarah Jenkins. Final billing ready.'
  },
  {
    id: 'inv-905',
    invoiceNumber: 'INV-2026-0045',
    tokenNumber: 'B-198',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    patientPhone: '+1 555-016-3390',
    serviceType: 'Pulmonology OPD & Nebulization Procedure',
    consultationFee: 45.00,
    laboratoryCharges: 25.00,
    pharmacyCharges: 15.00,
    otherCharges: 10.00,
    amount: 95.00,
    status: 'PAID',
    counter: 'Card Terminal #2',
    patientsAhead: 0,
    estimatedTimeMins: 0,
    issuedAt: '08:55 AM',
    dueDate: '2026-08-12',
    paymentMethod: 'CARD',
    paymentReference: 'CARD-AUTH-773910',
    paidAt: '09:02 AM',
    receiptNumber: 'REC-2026-8802',
    isDischargeBill: false,
    notes: 'Paid via Visa Debit card tap.'
  }
];

const hospitalLocations = [
  {
    id: 'loc-1',
    name: 'Main Registration & Token Kiosk',
    category: 'REGISTRATION',
    floor: 'Ground Floor',
    wing: 'Central Atrium',
    directionSteps: ['Enter main hospital glass gate', 'Head straight 20 meters', 'Kiosk screens located opposite Helpdesk'],
    queueWaitMins: 2,
    activeCounters: 4,
    openHours: '24/7'
  },
  {
    id: 'loc-2',
    name: 'General OPD & Consultations',
    category: 'OPD',
    floor: 'Ground Floor',
    wing: 'Block A',
    directionSteps: ['From atrium, turn left into Block A corridor', 'Rooms 101 to 115 are on the right side'],
    queueWaitMins: 12,
    activeCounters: 6,
    openHours: '08:00 AM - 08:00 PM'
  },
  {
    id: 'loc-3',
    name: 'Central Pharmacy & Medicine Dispense',
    category: 'PHARMACY',
    floor: 'Ground Floor',
    wing: 'Block B (Near Exit)',
    directionSteps: ['Walk past Billing counters', 'Turn right towards Block B Exit', 'Express pickup counters #1-#4'],
    queueWaitMins: 5,
    activeCounters: 4,
    openHours: '24/7'
  },
  {
    id: 'loc-4',
    name: 'Central Billing & Cashless Desk',
    category: 'BILLING',
    floor: 'Ground Floor',
    wing: 'Central Atrium',
    directionSteps: ['Located adjacent to main helpdesk', 'Counters #1 to #6 for cash/UPI/insurance'],
    queueWaitMins: 4,
    activeCounters: 5,
    openHours: '24/7'
  },
  {
    id: 'loc-5',
    name: 'Pathology & Diagnostic Laboratory',
    category: 'LABORATORY',
    floor: '1st Floor',
    wing: 'Block A',
    directionSteps: ['Take Elevator A to Floor 1', 'Turn right, follow blue line on floor for Blood Collection Lab'],
    queueWaitMins: 8,
    activeCounters: 3,
    openHours: '07:00 AM - 09:00 PM'
  },
  {
    id: 'loc-6',
    name: 'Radiology (X-Ray, MRI, CT Scan)',
    category: 'RADIOLOGY',
    floor: 'Basement 1',
    wing: 'Diagnostic Wing',
    directionSteps: ['Take Elevator B to Basement -1', 'Follow green wall signboards to Radiology Suite'],
    queueWaitMins: 15,
    activeCounters: 2,
    openHours: '24/7'
  },
  {
    id: 'loc-7',
    name: 'Emergency Trauma & Urgent Care Unit',
    category: 'EMERGENCY',
    floor: 'Ground Floor',
    wing: 'East Gate Emergency Wing',
    directionSteps: ['Enter directly through East Gate Ramp', 'Red line on floor leads directly to Triage Room 01'],
    queueWaitMins: 0,
    activeCounters: 6,
    openHours: '24/7 Priority Emergency'
  },
  {
    id: 'loc-8',
    name: 'Inpatient Wards & CCU Complex',
    category: 'WARD',
    floor: '2nd & 3rd Floors',
    wing: 'Block C Inpatient Tower',
    directionSteps: ['Take Central Elevator C to Floor 2', 'Ward Alpha (Rooms 201-230) & ICU Wing on the left'],
    queueWaitMins: 0,
    activeCounters: 3,
    openHours: 'Visiting Hours: 04:00 PM - 07:00 PM'
  }
];

let medicalHistories = [
  {
    id: 'mh-1',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    condition: 'Type 2 Diabetes Mellitus',
    diagnosedDate: '2022-04-15',
    status: 'ACTIVE',
    treatingDoctor: 'Dr. Aris Vance, MD',
    notes: 'Well controlled with Metformin 500mg daily and dietary adherence.',
    allergies: ['Penicillin', 'Sulfa drugs'],
    immunizations: ['COVID-19 Booster (2025)', 'Annual Influenza (2025)', 'Tetanus Toxoid (2024)']
  },
  {
    id: 'mh-2',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    condition: 'Essential Hypertension',
    diagnosedDate: '2023-09-10',
    status: 'ACTIVE',
    treatingDoctor: 'Dr. Sarah Jenkins, MD',
    notes: 'Mild hypertension. Monitored bi-monthly.',
    allergies: ['Penicillin', 'Sulfa drugs'],
    immunizations: ['COVID-19 Booster (2025)', 'Annual Influenza (2025)']
  },
  {
    id: 'mh-3',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    condition: 'Acute Bronchitis',
    diagnosedDate: '2024-11-02',
    status: 'RESOLVED',
    treatingDoctor: 'Dr. Aris Vance, MD',
    notes: 'Fully resolved after 7-day antibiotic course and rest.',
    allergies: ['Penicillin', 'Sulfa drugs'],
    immunizations: []
  }
];

let prescriptions = [
  {
    id: 'rx-101',
    prescriptionNumber: 'RX-2026-0891',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    doctorName: 'Dr. Aris Vance, MD',
    departmentName: 'General Medicine & OPD',
    date: '2026-08-10',
    medicines: [
      { name: 'Metformin 500mg', dosage: '1 tablet twice daily after meals', duration: '30 days', instructions: 'Take with full glass of water' },
      { name: 'Amlodipine 5mg', dosage: '1 tablet morning', duration: '30 days', instructions: 'Avoid grapefruit juice' },
      { name: 'Cough Syrup 100ml', dosage: '10ml thrice daily', duration: '5 days', instructions: 'Shake well before use' }
    ],
    diagnosis: 'Routine Diabetic Checkup & Mild Upper Respiratory Infection',
    status: 'DISPENSED'
  },
  {
    id: 'rx-102',
    prescriptionNumber: 'RX-2026-0412',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    doctorName: 'Dr. Sarah Jenkins, MD',
    departmentName: 'Cardiology & Vascular',
    date: '2026-06-18',
    medicines: [
      { name: 'Atorvastatin 10mg', dosage: '1 tablet at bedtime', duration: '60 days', instructions: 'Take regularly' },
      { name: 'Aspirin 75mg', dosage: '1 tablet daily', duration: '60 days', instructions: 'Take after breakfast' }
    ],
    diagnosis: 'Lipid Profile Follow-up & Cardiovascular Risk Management',
    status: 'COMPLETED'
  }
];

let labReports = [
  {
    id: 'lab-201',
    reportNumber: 'LAB-2026-4401',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    testName: 'Comprehensive Blood Chemistry & HbA1c',
    category: 'PATHOLOGY',
    orderedBy: 'Dr. Aris Vance, MD',
    orderDate: '2026-08-09',
    completedDate: '2026-08-10',
    status: 'COMPLETED',
    resultsSummary: 'HbA1c: 6.4% (Good Control). Fasting Glucose: 112 mg/dL. Lipid Profile: Normal.',
    isCritical: false,
    fileUrl: '/reports/lab-2026-4401.pdf',
    metrics: [
      { parameter: 'HbA1c (Glycated Hemoglobin)', result: '6.4 %', normalRange: '4.0 - 5.6 % (Pre-diabetic: 5.7 - 6.4%)', status: 'BORDERLINE' },
      { parameter: 'Fasting Blood Sugar', result: '112 mg/dL', normalRange: '70 - 99 mg/dL', status: 'MILD_HIGH' },
      { parameter: 'Serum Creatinine', result: '0.9 mg/dL', normalRange: '0.7 - 1.3 mg/dL', status: 'NORMAL' },
      { parameter: 'Total Cholesterol', result: '178 mg/dL', normalRange: '< 200 mg/dL', status: 'NORMAL' }
    ]
  },
  {
    id: 'lab-202',
    reportNumber: 'LAB-2026-3190',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    testName: 'Chest X-Ray PA View',
    category: 'RADIOLOGY',
    orderedBy: 'Dr. Aris Vance, MD',
    orderDate: '2026-08-09',
    completedDate: '2026-08-09',
    status: 'COMPLETED',
    resultsSummary: 'Clear lung fields. No focal consolidation, pneumothorax, or pleural effusion. Heart size normal.',
    isCritical: false,
    fileUrl: '/reports/lab-2026-3190.pdf',
    metrics: [
      { parameter: 'Lung Fields', result: 'Clear bilateral', normalRange: 'Clear', status: 'NORMAL' },
      { parameter: 'Cardiac Silhouette', result: 'Normal Size', normalRange: 'Normal', status: 'NORMAL' }
    ]
  },
  {
    id: 'lab-203',
    reportNumber: 'LAB-2026-5012',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    testName: 'Lipid Panel & Liver Function Test',
    category: 'PATHOLOGY',
    orderedBy: 'Dr. Sarah Jenkins, MD',
    orderDate: '2026-08-12',
    completedDate: '',
    status: 'IN_ANALYSIS',
    resultsSummary: 'Sample collected at 08:30 AM. Processing in pathology lab.',
    isCritical: false,
    metrics: []
  }
];

let notifications = [
  {
    id: 'notif-1',
    mrn: 'MRN-2026-8812',
    title: 'Appointment Reminder',
    message: 'Upcoming consultation with Dr. Aris Vance, MD scheduled for today at 10:30 AM at General OPD Room 102.',
    category: 'APPOINTMENT',
    timestamp: '15 mins ago',
    read: false,
    severity: 'INFO'
  },
  {
    id: 'notif-2',
    mrn: 'MRN-2026-8812',
    title: 'OPD Token Active Alert',
    message: 'Your token #A-101 is currently IN CONSULTATION at Room 102.',
    category: 'TOKEN',
    timestamp: '25 mins ago',
    read: false,
    severity: 'SUCCESS'
  },
  {
    id: 'notif-3',
    mrn: 'MRN-2026-8812',
    title: 'Lab Report Ready',
    message: 'Your Comprehensive Blood Chemistry & HbA1c lab report (LAB-2026-4401) is ready for download.',
    category: 'LAB_REPORT',
    timestamp: '2 hours ago',
    read: true,
    severity: 'INFO'
  },
  {
    id: 'notif-4',
    mrn: 'MRN-2026-8812',
    title: 'Pharmacy Order Dispensed',
    message: 'E-Prescription #RX-8823 has been dispensed at Express Counter #2.',
    category: 'PHARMACY',
    timestamp: '3 hours ago',
    read: true,
    severity: 'SUCCESS'
  },
  {
    id: 'notif-5',
    mrn: 'MRN-2026-8812',
    title: 'Doctor Schedule Advisory',
    message: 'Dr. Sarah Jenkins (Cardiology) is running 15 mins behind schedule due to emergency rounds.',
    category: 'DOCTOR_DELAY',
    timestamp: '4 hours ago',
    read: true,
    severity: 'WARNING'
  },
  {
    id: 'notif-6',
    mrn: 'MRN-2026-8812',
    title: 'OPD Invoice Ready',
    message: 'OPD Consultation Invoice #INV-2026-0041 for $75.00 has been generated. Tap to pay via UPI/Card.',
    category: 'BILLING',
    timestamp: '5 hours ago',
    read: false,
    severity: 'INFO'
  }
];

// ==================== AUTHENTICATION API ENDPOINTS ====================

app.post('/api/auth/login', (req, res) => {
  const { email, username, password } = req.body;
  const loginIdentifier = (email || username || '').trim().toLowerCase();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Please provide email/username and password' });
  }

  const user = usersDatabase.find(
    u => u.email.toLowerCase() === loginIdentifier || u.name.toLowerCase() === loginIdentifier
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email/username or password' });
  }

  const hashedAttempt = hashPassword(password, user.salt);
  if (hashedAttempt !== user.passwordHash) {
    return res.status(401).json({ error: 'Invalid email/username or password' });
  }

  const token = createSession(user.id);
  return res.json({
    message: 'Login successful',
    token,
    user: sanitizeUser(user)
  });
});

app.post('/api/auth/demo-login', (req, res) => {
  const { role } = req.body;
  const targetRole = (role || 'PATIENT').toUpperCase() as UserRole;

  const user = usersDatabase.find(u => u.role === targetRole);
  if (!user) {
    return res.status(404).json({ error: `Demo account for role ${targetRole} not found` });
  }

  const token = createSession(user.id);
  return res.json({
    message: `Demo login successful as ${user.name}`,
    token,
    user: sanitizeUser(user)
  });
});

app.post('/api/auth/register', (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    dob,
    gender,
    address,
    emergencyContactName,
    emergencyContactPhone,
    emergencyContactRelation,
    role
  } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Full name, email, and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = usersDatabase.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);
  const targetRole: UserRole = role && ['ADMIN', 'DOCTOR', 'NURSE', 'ATTENDER', 'PHARMACY'].includes(role) ? role : 'PATIENT';
  const newMrn = `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: UserAccount = {
    id: `usr-${targetRole.toLowerCase()}-${Date.now()}`,
    email: normalizedEmail,
    name,
    role: targetRole,
    passwordHash,
    salt,
    phone: phone || '',
    mrn: newMrn,
    dob: dob || '',
    gender: gender || 'Other',
    address: address || '',
    emergencyContactName: emergencyContactName || '',
    emergencyContactPhone: emergencyContactPhone || '',
    emergencyContactRelation: emergencyContactRelation || '',
    createdAt: new Date().toISOString()
  };

  usersDatabase.push(newUser);
  const token = createSession(newUser.id);

  return res.status(201).json({
    message: 'Account registered successfully',
    token,
    user: sanitizeUser(newUser)
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : (req.headers['x-auth-token'] as string);

  if (!token) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const session = activeSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }

  const user = usersDatabase.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  return res.json({ user: sanitizeUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '').trim() : (req.headers['x-auth-token'] as string);

  if (token) {
    activeSessions.delete(token);
  }

  return res.json({ message: 'Logged out successfully' });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Please provide email and new password' });
  }

  const user = usersDatabase.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No user account found with this email' });
  }

  const salt = generateSalt();
  user.salt = salt;
  user.passwordHash = hashPassword(newPassword, salt);

  return res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
});

app.get('/api/auth/users', (req, res) => {
  res.json(usersDatabase.map(sanitizeUser));
});

app.post('/api/auth/admin/create-staff', (req, res) => {
  const { name, email, password, role, departmentName, roomNumber, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password and role are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (usersDatabase.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'User email already exists' });
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const staffUser: UserAccount = {
    id: `usr-staff-${Date.now()}`,
    email: normalizedEmail,
    name,
    role: role as UserRole,
    passwordHash,
    salt,
    phone: phone || '',
    departmentName: departmentName || '',
    roomNumber: roomNumber || '',
    createdAt: new Date().toISOString()
  };

  usersDatabase.push(staffUser);
  return res.status(201).json({ message: 'Staff account created successfully', user: sanitizeUser(staffUser) });
});

// ==================== API ENDPOINTS ====================

app.get('/api/stats', (req, res) => {
  const waitingTokensCount = queueTokens.filter(t => t.status === 'WAITING').length;
  const criticalCount = patientVitals.filter(v => v.alertStatus === 'CRITICAL').length;
  
  res.json({
    totalPatientsToday: 248,
    activeOPDQueue: waitingTokensCount,
    avgWaitTimeMins: 11,
    doctorsActive: doctors.filter(d => d.isAvailable).length,
    nursesOnShift: 42,
    criticalAlerts: criticalCount,
    bedsOccupancyRate: 82,
    queueReductionPercent: 64
  });
});

app.get('/api/departments', (req, res) => {
  res.json(departments);
});

app.get('/api/doctors', (req, res) => {
  const { departmentId } = req.query;
  if (departmentId) {
    res.json(doctors.filter(d => d.departmentId === departmentId));
  } else {
    res.json(doctors);
  }
});

// ==================== SMART QUEUE MANAGEMENT DATA & ROUTES ====================

let smartQueueItems: any[] = [
  // 1. Registration Queue
  {
    id: 'sq-101',
    department: 'Registration',
    tokenNumber: 'REG-101',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    patientPhone: '+1 (555) 234-5678',
    serviceProvider: 'Registration Counter #1 (Nurse Sarah)',
    status: 'IN_SERVICE',
    arrivalTime: '08:45 AM',
    startTime: '09:00 AM',
    completionTime: '',
    serviceDuration: 5,
    priority: 'Low',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Desk #1'
  },
  {
    id: 'sq-102',
    department: 'Registration',
    tokenNumber: 'REG-102',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-9011',
    patientPhone: '+1 (555) 345-6789',
    serviceProvider: 'Registration Counter #2 (Clerk John)',
    status: 'CALLING',
    arrivalTime: '08:50 AM',
    startTime: '09:02 AM',
    completionTime: '',
    serviceDuration: 4,
    priority: 'Moderate',
    queuePosition: 2,
    estimatedWaitMinutes: 0,
    counterNumber: 'Desk #2'
  },
  {
    id: 'sq-103',
    department: 'Registration',
    tokenNumber: 'REG-103',
    patientName: 'Robert Martinez',
    mrn: 'MRN-2026-4432',
    patientPhone: '+1 (555) 456-7890',
    serviceProvider: 'Registration Desk',
    status: 'WAITING',
    arrivalTime: '09:05 AM',
    serviceDuration: 5,
    priority: 'Low',
    queuePosition: 3,
    estimatedWaitMinutes: 5,
    counterNumber: 'Registration Area'
  },

  // 2. General OPD Queue
  {
    id: 'sq-201',
    department: 'General OPD',
    tokenNumber: 'OPD-201',
    patientName: 'Sophia Williams',
    mrn: 'MRN-2026-1190',
    patientPhone: '+1 (555) 567-8901',
    serviceProvider: 'Dr. Aris Vance, MD',
    status: 'IN_SERVICE',
    arrivalTime: '09:00 AM',
    startTime: '09:15 AM',
    serviceDuration: 10,
    priority: 'Low',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Room 102'
  },
  {
    id: 'sq-202',
    department: 'General OPD',
    tokenNumber: 'OPD-202',
    patientName: 'James Anderson',
    mrn: 'MRN-2026-3382',
    patientPhone: '+1 (555) 678-9012',
    serviceProvider: 'Dr. Aris Vance, MD',
    status: 'WAITING',
    arrivalTime: '09:10 AM',
    serviceDuration: 8,
    priority: 'Moderate',
    queuePosition: 2,
    estimatedWaitMinutes: 8,
    counterNumber: 'Room 102'
  },
  {
    id: 'sq-203',
    department: 'General OPD',
    tokenNumber: 'OPD-203',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    patientPhone: '+1 (555) 012-7723',
    serviceProvider: 'Dr. Aris Vance, MD',
    status: 'EMERGENCY',
    arrivalTime: '09:20 AM',
    serviceDuration: 12,
    priority: 'Critical',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Room 102'
  },

  // 3. Specialist OPD Queue
  {
    id: 'sq-301',
    department: 'Specialist OPD',
    tokenNumber: 'SPEC-301',
    patientName: 'Beatrix Thorne',
    mrn: 'MRN-2026-3302',
    patientPhone: '+1 (555) 789-0123',
    serviceProvider: 'Dr. Sarah Jenkins, MD (Cardiology)',
    status: 'IN_SERVICE',
    arrivalTime: '09:15 AM',
    startTime: '09:25 AM',
    serviceDuration: 15,
    priority: 'High',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Room 205'
  },
  {
    id: 'sq-302',
    department: 'Specialist OPD',
    tokenNumber: 'SPEC-302',
    patientName: 'Clara Oswald',
    mrn: 'MRN-2026-5510',
    patientPhone: '+1 (555) 890-1234',
    serviceProvider: 'Dr. Rajesh Nair, MS (Orthopedics)',
    status: 'WAITING',
    arrivalTime: '09:30 AM',
    serviceDuration: 12,
    priority: 'Moderate',
    queuePosition: 2,
    estimatedWaitMinutes: 15,
    counterNumber: 'Room 214'
  },

  // 4. Laboratory Queue
  {
    id: 'sq-401',
    department: 'Laboratory',
    tokenNumber: 'LAB-401',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    patientPhone: '+1 (555) 234-5678',
    serviceProvider: 'Lab Tech Raj (Phlebotomy)',
    status: 'CALLING',
    arrivalTime: '09:25 AM',
    startTime: '09:32 AM',
    serviceDuration: 6,
    priority: 'Moderate',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Lab Collection Window #2',
    transferredFrom: 'General OPD',
    transferNotes: 'Stat blood glucose & HbA1c panel ordered'
  },
  {
    id: 'sq-402',
    department: 'Laboratory',
    tokenNumber: 'LAB-402',
    patientName: 'Eleanor Vance',
    mrn: 'MRN-2026-9011',
    patientPhone: '+1 (555) 345-6789',
    serviceProvider: 'Lab Tech Priya',
    status: 'WAITING',
    arrivalTime: '09:30 AM',
    serviceDuration: 7,
    priority: 'Low',
    queuePosition: 2,
    estimatedWaitMinutes: 6,
    counterNumber: 'Lab Collection Window #1'
  },

  // 5. Pharmacy Queue
  {
    id: 'sq-501',
    department: 'Pharmacy',
    tokenNumber: 'PHM-501',
    patientName: 'Robert Martinez',
    mrn: 'MRN-2026-4432',
    patientPhone: '+1 (555) 456-7890',
    serviceProvider: 'Chief Pharmacist Sanjeev',
    status: 'IN_SERVICE',
    arrivalTime: '09:10 AM',
    startTime: '09:20 AM',
    serviceDuration: 5,
    priority: 'Low',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Pharmacy Counter #1'
  },
  {
    id: 'sq-502',
    department: 'Pharmacy',
    tokenNumber: 'PHM-502',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    patientPhone: '+1 (555) 234-5678',
    serviceProvider: 'Pharmacist Ananya',
    status: 'WAITING',
    arrivalTime: '09:35 AM',
    serviceDuration: 4,
    priority: 'Moderate',
    queuePosition: 2,
    estimatedWaitMinutes: 5,
    counterNumber: 'Express Counter #2',
    transferredFrom: 'General OPD',
    transferNotes: 'e-Prescription RX-8823 auto-routed'
  },

  // 6. Billing Queue
  {
    id: 'sq-601',
    department: 'Billing',
    tokenNumber: 'BIL-601',
    patientName: 'Arthur Pendelton',
    mrn: 'MRN-2026-1049',
    patientPhone: '+1 (555) 012-7723',
    serviceProvider: 'Billing Agent Marcus',
    status: 'CALLING',
    arrivalTime: '09:30 AM',
    startTime: '09:40 AM',
    serviceDuration: 6,
    priority: 'High',
    queuePosition: 1,
    estimatedWaitMinutes: 0,
    counterNumber: 'Billing Desk #3'
  },
  {
    id: 'sq-602',
    department: 'Billing',
    tokenNumber: 'BIL-602',
    patientName: 'David Miller',
    mrn: 'MRN-2026-8812',
    patientPhone: '+1 (555) 234-5678',
    serviceProvider: 'Billing Agent Clara',
    status: 'WAITING',
    arrivalTime: '09:42 AM',
    serviceDuration: 5,
    priority: 'Low',
    queuePosition: 2,
    estimatedWaitMinutes: 6,
    counterNumber: 'UPI Express Counter #1'
  }
];

function recalculateSmartQueuePositions(dept?: string) {
  const deptsToUpdate = dept
    ? [dept]
    : ['Registration', 'General OPD', 'Specialist OPD', 'Laboratory', 'Pharmacy', 'Billing'];

  deptsToUpdate.forEach((d) => {
    const deptTokens = smartQueueItems.filter((t) => t.department === d);
    const activeTokens = deptTokens.filter(
      (t) => t.status === 'EMERGENCY' || t.status === 'CALLING' || t.status === 'IN_SERVICE' || t.status === 'WAITING'
    );

    activeTokens.sort((a, b) => {
      const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
      const statusWeight: Record<string, number> = { EMERGENCY: 100, CALLING: 80, IN_SERVICE: 70, WAITING: 10 };

      const scoreA = (statusWeight[a.status] || 0) + (priorityWeight[a.priority] || 0);
      const scoreB = (statusWeight[b.status] || 0) + (priorityWeight[b.priority] || 0);
      return scoreB - scoreA;
    });

    let runningWait = 0;
    activeTokens.forEach((item, index) => {
      item.queuePosition = index + 1;
      if (item.status === 'IN_SERVICE' || item.status === 'CALLING') {
        item.estimatedWaitMinutes = 0;
      } else {
        item.estimatedWaitMinutes = runningWait;
        runningWait += Number(item.serviceDuration) || 5;
      }
    });
  });
}

// Initial calculation
recalculateSmartQueuePositions();

app.get('/api/smart-queue', (req, res) => {
  const { department, search, mrn } = req.query;
  recalculateSmartQueuePositions(department as string);

  let result = [...smartQueueItems];
  if (department) {
    result = result.filter((q) => q.department === department);
  }
  if (mrn) {
    result = result.filter((q) => q.mrn === mrn || q.patientName.toLowerCase().includes((mrn as string).toLowerCase()));
  }
  if (search) {
    const qStr = (search as string).toLowerCase();
    result = result.filter(
      (q) =>
        q.tokenNumber.toLowerCase().includes(qStr) ||
        q.patientName.toLowerCase().includes(qStr) ||
        q.mrn.toLowerCase().includes(qStr) ||
        q.serviceProvider.toLowerCase().includes(qStr)
    );
  }

  res.json(result);
});

app.post('/api/smart-queue', (req, res) => {
  const { department, patientName, mrn, patientPhone, serviceProvider, priority, serviceDuration, counterNumber } = req.body;

  const deptName = (department || 'Registration') as any;
  const prefixMap: Record<string, string> = {
    Registration: 'REG',
    'General OPD': 'OPD',
    'Specialist OPD': 'SPEC',
    Laboratory: 'LAB',
    Pharmacy: 'PHM',
    Billing: 'BIL'
  };

  const prefix = prefixMap[deptName] || 'TOK';
  const existingCount = smartQueueItems.filter((q) => q.department === deptName).length;
  const tokenNumber = `${prefix}-${101 + existingCount}`;

  const newItem = {
    id: `sq-${Date.now()}`,
    department: deptName,
    tokenNumber,
    patientName: patientName || 'Walk-in Patient',
    mrn: mrn || `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    patientPhone: patientPhone || '+1 (555) 000-1111',
    serviceProvider: serviceProvider || `${deptName} Counter #1`,
    status: priority === 'Critical' ? ('EMERGENCY' as const) : ('WAITING' as const),
    arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    serviceDuration: Number(serviceDuration) || 5,
    priority: priority || 'Low',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    counterNumber: counterNumber || `${deptName} Counter #1`
  };

  smartQueueItems.unshift(newItem);
  recalculateSmartQueuePositions(deptName);

  // Send Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: newItem.mrn,
    title: `Queue Token Issued (${newItem.department})`,
    message: `Token #${newItem.tokenNumber} issued for ${newItem.patientName} at ${newItem.department}.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: newItem.priority === 'Critical' ? 'CRITICAL' : 'INFO'
  });

  res.status(201).json(newItem);
});

// Staff Action: Call Next Patient
app.post('/api/smart-queue/:id/call-next', (req, res) => {
  const { id } = req.params;
  const { counterNumber, serviceProvider } = req.body;

  let target = smartQueueItems.find((q) => q.id === id);

  if (!target) {
    // If no ID supplied or 'next', find the highest priority waiting token in that department
    const dept = req.body.department || 'Registration';
    const waitingList = smartQueueItems.filter((q) => q.department === dept && (q.status === 'WAITING' || q.status === 'EMERGENCY'));
    
    if (waitingList.length === 0) {
      return res.status(404).json({ error: 'No waiting patients in queue' });
    }
    
    // Sort by priority
    waitingList.sort((a, b) => {
      const priorityWeight: Record<string, number> = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
      return (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1);
    });
    
    target = waitingList[0];
  }

  target.status = 'CALLING';
  target.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (counterNumber) target.counterNumber = counterNumber;
  if (serviceProvider) target.serviceProvider = serviceProvider;

  recalculateSmartQueuePositions(target.department);

  // Send real-time call notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: target.mrn,
    title: `TOKEN CALLED: #${target.tokenNumber}`,
    message: `Token #${target.tokenNumber} (${target.patientName}) please report immediately to ${target.department} - ${target.counterNumber || 'Main Desk'}.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.json({ message: `Token ${target.tokenNumber} called successfully`, token: target });
});

// Staff Action: Skip Patient
app.post('/api/smart-queue/:id/skip', (req, res) => {
  const { id } = req.params;
  const target = smartQueueItems.find((q) => q.id === id);
  if (!target) return res.status(404).json({ error: 'Queue token not found' });

  target.status = 'SKIPPED';
  recalculateSmartQueuePositions(target.department);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: target.mrn,
    title: `Token Skipped: #${target.tokenNumber}`,
    message: `Token #${target.tokenNumber} was temporarily skipped at ${target.department}. Please contact counter staff to be recalled.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'WARNING'
  });

  res.json({ message: 'Patient token marked as skipped', token: target });
});

// Staff Action: Recall Patient
app.post('/api/smart-queue/:id/recall', (req, res) => {
  const { id } = req.params;
  const target = smartQueueItems.find((q) => q.id === id);
  if (!target) return res.status(404).json({ error: 'Queue token not found' });

  target.status = 'CALLING';
  recalculateSmartQueuePositions(target.department);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: target.mrn,
    title: `TOKEN RECALLED: #${target.tokenNumber}`,
    message: `RECALL: Token #${target.tokenNumber} (${target.patientName}) please report NOW to ${target.department} - ${target.counterNumber || 'Counter'}.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.json({ message: 'Patient token recalled', token: target });
});

// Staff Action: Mark In Service
app.post('/api/smart-queue/:id/in-service', (req, res) => {
  const { id } = req.params;
  const target = smartQueueItems.find((q) => q.id === id);
  if (!target) return res.status(404).json({ error: 'Queue token not found' });

  target.status = 'IN_SERVICE';
  if (!target.startTime) {
    target.startTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  recalculateSmartQueuePositions(target.department);
  res.json({ message: 'Patient marked as in service', token: target });
});

// Staff Action: Complete Service
app.post('/api/smart-queue/:id/complete', (req, res) => {
  const { id } = req.params;
  const target = smartQueueItems.find((q) => q.id === id);
  if (!target) return res.status(404).json({ error: 'Queue token not found' });

  target.status = 'COMPLETED';
  target.completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  recalculateSmartQueuePositions(target.department);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: target.mrn,
    title: `Service Completed (${target.department})`,
    message: `Token #${target.tokenNumber} consultation/service completed at ${target.department}.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.json({ message: 'Service marked as completed', token: target });
});

// Staff Action: Mark Emergency
app.post('/api/smart-queue/:id/emergency', (req, res) => {
  const { id } = req.params;
  const target = smartQueueItems.find((q) => q.id === id);
  if (!target) return res.status(404).json({ error: 'Queue token not found' });

  target.status = 'EMERGENCY';
  target.priority = 'Critical';
  target.queuePosition = 1;

  recalculateSmartQueuePositions(target.department);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: target.mrn,
    title: `EMERGENCY QUEUE PRIORITY: #${target.tokenNumber}`,
    message: `Emergency status assigned to Token #${target.tokenNumber} (${target.patientName}) at ${target.department}! Moved to top of queue.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'CRITICAL'
  });

  res.json({ message: 'Marked as emergency queue item', token: target });
});

// Staff Action: Transfer Queue
app.post('/api/smart-queue/:id/transfer', (req, res) => {
  const { id } = req.params;
  const { targetDepartment, transferNotes, serviceProvider } = req.body;

  const source = smartQueueItems.find((q) => q.id === id);
  if (!source) return res.status(404).json({ error: 'Queue token not found' });

  // Complete current token in source department
  source.status = 'COMPLETED';
  source.completionTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Generate new token in target department
  const prefixMap: Record<string, string> = {
    Registration: 'REG',
    'General OPD': 'OPD',
    'Specialist OPD': 'SPEC',
    Laboratory: 'LAB',
    Pharmacy: 'PHM',
    Billing: 'BIL'
  };

  const prefix = prefixMap[targetDepartment as string] || 'TRF';
  const targetCount = smartQueueItems.filter((q) => q.department === targetDepartment).length;
  const newTokenNumber = `${prefix}-${201 + targetCount}`;

  const transferredItem = {
    id: `sq-${Date.now()}`,
    department: targetDepartment,
    tokenNumber: newTokenNumber,
    patientName: source.patientName,
    mrn: source.mrn,
    patientPhone: source.patientPhone,
    serviceProvider: serviceProvider || `${targetDepartment} Main Counter`,
    status: 'WAITING' as const,
    arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    serviceDuration: source.serviceDuration || 6,
    priority: source.priority || 'Moderate',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    counterNumber: `${targetDepartment} Counter #1`,
    transferredFrom: source.department,
    transferNotes: transferNotes || `Transferred from ${source.department}`
  };

  smartQueueItems.unshift(transferredItem);
  recalculateSmartQueuePositions(source.department);
  recalculateSmartQueuePositions(targetDepartment);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: source.mrn,
    title: `Transferred to ${targetDepartment}`,
    message: `Patient ${source.patientName} transferred from ${source.department} to ${targetDepartment}. New Token #${newTokenNumber}.`,
    category: 'TOKEN',
    timestamp: 'Just now',
    read: false,
    severity: 'INFO'
  });

  res.json({
    message: `Patient transferred to ${targetDepartment}`,
    sourceToken: source,
    transferredToken: transferredItem
  });
});

app.get('/api/tokens', (req, res) => {
  const { doctorId, status } = req.query;
  let result = [...queueTokens];
  if (doctorId) {
    result = result.filter(t => t.doctorId === doctorId);
  }
  if (status) {
    result = result.filter(t => t.status === status);
  }
  res.json(result);
});

app.post('/api/tokens', (req, res) => {
  const { patientName, patientPhone, departmentId, doctorId, priority } = req.body;
  
  const dept = departments.find(d => d.id === departmentId) || departments[0];
  const doc = doctors.find(d => d.id === doctorId) || doctors[0];
  
  // Calculate token number
  const prefix = dept.code.substring(0, 1) || 'T';
  const seq = queueTokens.filter(t => t.departmentId === dept.id).length + 101;
  const tokenNumber = `${prefix}-${seq}`;

  // Estimate wait time based on queue length and priority
  const existingQueue = queueTokens.filter(t => t.doctorId === doc.id && t.status === 'WAITING').length;
  let waitMins = existingQueue * doc.avgConsultationTimeMins;
  if (priority === 'EMERGENCY') waitMins = 0;
  if (priority === 'SENIOR_CITIZEN') waitMins = Math.max(0, Math.floor(waitMins * 0.5));

  const newToken = {
    id: `tok-${Date.now()}`,
    tokenNumber,
    sequenceNo: seq,
    priority: priority || 'NORMAL',
    status: 'WAITING',
    estimatedWaitMinutes: waitMins,
    issueTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    counterNumber: doc.roomNumber,
    departmentId: dept.id,
    departmentName: dept.name,
    doctorId: doc.id,
    doctorName: doc.name,
    patientId: `pat-${Date.now()}`,
    patientName: patientName || 'Walk-in Patient',
    patientPhone: patientPhone || '+1 (555) 000-0000',
    mrn: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`
  };

  queueTokens.unshift(newToken);
  
  // Increment doctor's token count
  doc.totalTokensIssued += 1;

  res.status(201).json(newToken);
});

app.patch('/api/tokens/:id', (req, res) => {
  const { id } = req.params;
  const { status, counterNumber } = req.body;

  const tokenIndex = queueTokens.findIndex(t => t.id === id);
  if (tokenIndex === -1) {
    return res.status(404).json({ error: 'Token not found' });
  }

  const updatedToken = {
    ...queueTokens[tokenIndex],
    status: status || queueTokens[tokenIndex].status,
    counterNumber: counterNumber || queueTokens[tokenIndex].counterNumber,
    calledTime: status === 'IN_CONSULTATION' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : queueTokens[tokenIndex].calledTime,
    completedTime: status === 'COMPLETED' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (queueTokens[tokenIndex] as any).completedTime
  };

  queueTokens[tokenIndex] = updatedToken;
  res.json(updatedToken);
});

app.get('/api/appointments', (req, res) => {
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const { patientName, patientPhone, doctorId, date, timeSlot, type, symptoms } = req.body;
  const doc = doctors.find(d => d.id === doctorId) || doctors[0];

  const newAppointment = {
    id: `apt-${Date.now()}`,
    patientName: patientName || 'John Doe',
    patientPhone: patientPhone || '+1 (555) 888-9999',
    mrn: `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    doctorId: doc.id,
    doctorName: doc.name,
    departmentName: doc.departmentName,
    date: date || new Date().toISOString().split('T')[0],
    timeSlot: timeSlot || '10:00 AM',
    type: type || 'OPD',
    status: 'CONFIRMED',
    symptoms: symptoms || 'General Checkup'
  };

  appointments.unshift(newAppointment);

  // Add notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: newAppointment.mrn,
    title: 'New Appointment Booked',
    message: `Appointment with ${doc.name} confirmed for ${newAppointment.date} at ${newAppointment.timeSlot}.`,
    category: 'APPOINTMENT',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.status(201).json(newAppointment);
});

app.patch('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { date, timeSlot, status, symptoms } = req.body;
  const aptIndex = appointments.findIndex(a => a.id === id);
  if (aptIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  appointments[aptIndex] = {
    ...appointments[aptIndex],
    ...(date && { date }),
    ...(timeSlot && { timeSlot }),
    ...(status && { status }),
    ...(symptoms && { symptoms })
  };

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: appointments[aptIndex].mrn,
    title: status === 'CANCELLED' ? 'Appointment Cancelled' : 'Appointment Rescheduled',
    message: status === 'CANCELLED' 
      ? `Appointment with ${appointments[aptIndex].doctorName} has been cancelled.` 
      : `Rescheduled with ${appointments[aptIndex].doctorName} for ${appointments[aptIndex].date} at ${appointments[aptIndex].timeSlot}.`,
    category: 'APPOINTMENT',
    timestamp: 'Just now',
    read: false,
    severity: status === 'CANCELLED' ? 'WARNING' : 'INFO'
  });

  res.json(appointments[aptIndex]);
});

app.delete('/api/appointments/:id', (req, res) => {
  const { id } = req.params;
  const aptIndex = appointments.findIndex(a => a.id === id);
  if (aptIndex !== -1) {
    appointments[aptIndex].status = 'CANCELLED';
    return res.json({ message: 'Appointment cancelled successfully', appointment: appointments[aptIndex] });
  }
  res.status(404).json({ error: 'Appointment not found' });
});

app.get('/api/medical-records', (req, res) => {
  const { mrn } = req.query;
  const userMrn = (mrn as string) || 'MRN-2026-8812';

  const patientHistories = medicalHistories.filter(m => !mrn || m.mrn === userMrn || userMrn === 'MRN-2026-8812');
  const patientPrescriptions = prescriptions.filter(p => !mrn || p.mrn === userMrn || userMrn === 'MRN-2026-8812');
  const patientLabReports = labReports.filter(l => !mrn || l.mrn === userMrn || userMrn === 'MRN-2026-8812');
  const previousAppointments = appointments.filter(a => a.status === 'COMPLETED' || new Date(a.date) < new Date());

  res.json({
    history: patientHistories.length > 0 ? patientHistories : medicalHistories,
    prescriptions: patientPrescriptions.length > 0 ? patientPrescriptions : prescriptions,
    labReports: patientLabReports.length > 0 ? patientLabReports : labReports,
    previousAppointments: previousAppointments.length > 0 ? previousAppointments : [
      {
        id: 'apt-prev-1',
        patientName: 'David Miller',
        patientPhone: '+1 (555) 234-5678',
        mrn: 'MRN-2026-8812',
        doctorId: 'doc-1',
        doctorName: 'Dr. Aris Vance, MD',
        departmentName: 'General Medicine & OPD',
        date: '2026-07-28',
        timeSlot: '09:30 AM',
        type: 'OPD',
        status: 'COMPLETED',
        symptoms: 'Quarterly diabetic consultation & blood work order'
      },
      {
        id: 'apt-prev-2',
        patientName: 'David Miller',
        patientPhone: '+1 (555) 234-5678',
        mrn: 'MRN-2026-8812',
        doctorId: 'doc-2',
        doctorName: 'Dr. Sarah Jenkins, MD',
        departmentName: 'Cardiology & Vascular',
        date: '2026-06-18',
        timeSlot: '11:00 AM',
        type: 'FOLLOW_UP',
        status: 'COMPLETED',
        symptoms: 'Cardiovascular risk evaluation'
      }
    ]
  });
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const target = notifications.find(n => n.id === id);
  if (target) {
    target.read = true;
    return res.json(target);
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  notifications.forEach(n => { n.read = true; });
  res.json({ message: 'All notifications marked as read', notifications });
});

app.get('/api/vitals', (req, res) => {
  res.json(patientVitals);
});

app.patch('/api/vitals/:id', (req, res) => {
  const { id } = req.params;
  const vitalIndex = patientVitals.findIndex(v => v.id === id);
  if (vitalIndex === -1) {
    return res.status(404).json({ error: 'Vitals record not found' });
  }

  patientVitals[vitalIndex] = {
    ...patientVitals[vitalIndex],
    ...req.body,
    lastUpdated: 'Just now'
  };

  res.json(patientVitals[vitalIndex]);
});

// ==================== PHARMACY & INVENTORY ENDPOINTS ====================

app.get('/api/pharmacy/inventory', (req, res) => {
  const lowStockCount = medicineInventory.filter(m => m.stockQuantity <= m.minStockLevel).length;
  const outOfStockCount = medicineInventory.filter(m => m.stockQuantity === 0).length;
  res.json({
    inventory: medicineInventory,
    stats: {
      totalMedicines: medicineInventory.length,
      lowStockCount,
      outOfStockCount
    }
  });
});

app.post('/api/pharmacy/inventory', (req, res) => {
  const { name, category, dosageForm, strength, stockQuantity, minStockLevel, expiryDate, pricePerUnit, locationRack } = req.body;
  
  const qty = Number(stockQuantity) || 0;
  const minQty = Number(minStockLevel) || 10;
  const availability = qty === 0 ? 'OUT_OF_STOCK' : qty <= minQty ? 'LOW_STOCK' : 'IN_STOCK';

  const newMed = {
    id: `med-${Date.now()}`,
    name: name || 'New Medicine',
    category: category || 'General',
    dosageForm: dosageForm || 'Tablet',
    strength: strength || '100mg',
    stockQuantity: qty,
    minStockLevel: minQty,
    expiryDate: expiryDate || '2028-01-01',
    pricePerUnit: Number(pricePerUnit) || 10.0,
    locationRack: locationRack || 'Rack A-01',
    availability
  };

  medicineInventory.unshift(newMed);
  res.status(201).json(newMed);
});

app.patch('/api/pharmacy/inventory/:id', (req, res) => {
  const { id } = req.params;
  const index = medicineInventory.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Medicine not found in inventory' });
  }

  const updated = { ...medicineInventory[index], ...req.body };
  
  // Recalculate availability based on stock level
  if (updated.stockQuantity === 0) {
    updated.availability = 'OUT_OF_STOCK';
  } else if (updated.stockQuantity <= updated.minStockLevel) {
    updated.availability = 'LOW_STOCK';
  } else {
    updated.availability = 'IN_STOCK';
  }

  medicineInventory[index] = updated;
  res.json(updated);
});

app.get('/api/pharmacy', (req, res) => {
  res.json(pharmacyOrders);
});

app.post('/api/pharmacy/verify/:id', (req, res) => {
  const { id } = req.params;
  const { pharmacistName, notes } = req.body;
  const index = pharmacyOrders.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pharmacy order not found' });
  }

  pharmacyOrders[index].status = 'VERIFIED';
  pharmacyOrders[index].verifiedBy = pharmacistName || 'Chief Pharmacist Sanjeev';
  pharmacyOrders[index].verifiedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (notes) pharmacyOrders[index].notes = notes;

  res.json(pharmacyOrders[index]);
});

app.patch('/api/pharmacy/:id', (req, res) => {
  const { id } = req.params;
  const { status, pickupCounter, notes } = req.body;
  const orderIndex = pharmacyOrders.findIndex(p => p.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const prevStatus = pharmacyOrders[orderIndex].status;
  pharmacyOrders[orderIndex].status = status || pharmacyOrders[orderIndex].status;
  if (pickupCounter) pharmacyOrders[orderIndex].pickupCounter = pickupCounter;
  if (notes) pharmacyOrders[orderIndex].notes = notes;

  // Send Notification when order status transitions
  if (status === 'READY_FOR_PICKUP' && prevStatus !== 'READY_FOR_PICKUP') {
    pharmacyOrders[orderIndex].estimatedTimeMins = 0;
    pharmacyOrders[orderIndex].patientsAhead = 0;

    notifications.unshift({
      id: `notif-${Date.now()}`,
      mrn: pharmacyOrders[orderIndex].mrn,
      title: 'Medicine Ready for Pickup',
      message: `Prescription ${pharmacyOrders[orderIndex].orderNumber} (Token #${pharmacyOrders[orderIndex].tokenNumber}) is READY at ${pharmacyOrders[orderIndex].pickupCounter}. Show QR Code for verification.`,
      category: 'PHARMACY',
      timestamp: 'Just now',
      read: false,
      severity: 'SUCCESS'
    });
  } else if (status === 'DISPENSED' && prevStatus !== 'DISPENSED') {
    notifications.unshift({
      id: `notif-${Date.now()}`,
      mrn: pharmacyOrders[orderIndex].mrn,
      title: 'Prescription Dispensed Successfully',
      message: `Prescription ${pharmacyOrders[orderIndex].orderNumber} has been verified & handed over. Thank you!`,
      category: 'PHARMACY',
      timestamp: 'Just now',
      read: false,
      severity: 'SUCCESS'
    });
  }

  res.json(pharmacyOrders[orderIndex]);
});

app.post('/api/pharmacy/express-pickup/:id', (req, res) => {
  const { id } = req.params;
  const { verificationCode } = req.body;
  const orderIndex = pharmacyOrders.findIndex(p => p.id === id || p.orderNumber === id || p.tokenNumber === id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Express pickup token/order not found' });
  }

  const order = pharmacyOrders[orderIndex];
  order.status = 'DISPENSED';
  order.isExpressPickup = true;
  order.pickupCounter = 'Express Pickup Counter #3';

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: order.mrn,
    title: 'Express Pickup Completed',
    message: `Token #${order.tokenNumber} verified via Express Counter #3. Prescription dispensed.`,
    category: 'PHARMACY',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.json({ message: 'Express pickup successful', order });
});

app.get('/api/billing', (req, res) => {
  const waitingPatientsCount = billingInvoices.filter(i => i.status === 'WAITING' || i.status === 'PENDING').length;
  const processingBillsCount = billingInvoices.filter(i => i.status === 'PROCESSING').length;
  const completedBillsCount = billingInvoices.filter(i => i.status === 'PAID').length;
  const totalRevenue = billingInvoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, item) => sum + item.amount, 0);

  const stats = {
    waitingPatientsCount,
    processingBillsCount,
    completedBillsCount,
    avgWaitTimeMins: 4,
    totalRevenue
  };

  res.json({
    invoices: billingInvoices,
    stats
  });
});

app.post('/api/billing/token', (req, res) => {
  const {
    patientName,
    mrn,
    patientPhone,
    serviceType,
    consultationFee = 0,
    laboratoryCharges = 0,
    pharmacyCharges = 0,
    otherCharges = 0,
    isDischargeBill = false,
    notes = ''
  } = req.body;

  if (!patientName || !mrn) {
    return res.status(400).json({ error: 'Patient name and MRN are required' });
  }

  const tokenNum = `B-${200 + billingInvoices.length + 1}`;
  const invNum = `INV-2026-00${45 + billingInvoices.length + 1}`;
  const total = Number(consultationFee) + Number(laboratoryCharges) + Number(pharmacyCharges) + Number(otherCharges);

  const waitingCount = billingInvoices.filter(i => i.status === 'WAITING' || i.status === 'PROCESSING').length;

  const newInvoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: invNum,
    tokenNumber: tokenNum,
    patientName,
    mrn,
    patientPhone: patientPhone || '+1 555-010-0000',
    serviceType: serviceType || (isDischargeBill ? 'IPD Hospital Discharge Clearance' : 'OPD Consultation & Service Charge'),
    consultationFee: Number(consultationFee),
    laboratoryCharges: Number(laboratoryCharges),
    pharmacyCharges: Number(pharmacyCharges),
    otherCharges: Number(otherCharges),
    amount: total > 0 ? total : 75.00,
    status: 'WAITING',
    counter: isDischargeBill ? 'Inpatient Discharge Counter #4' : 'Billing Desk #1 / UPI Counter',
    patientsAhead: waitingCount,
    estimatedTimeMins: (waitingCount + 1) * 3,
    issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    dueDate: new Date().toISOString().split('T')[0],
    isDischargeBill: Boolean(isDischargeBill),
    notes
  };

  billingInvoices.unshift(newInvoice);

  // Trigger Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn,
    title: isDischargeBill ? 'Discharge Billing Ready' : 'Billing Token Generated',
    message: `${isDischargeBill ? 'Discharge bill' : 'Billing token'} #${tokenNum} (${invNum}) generated for ${patientName}. Total payable: $${newInvoice.amount.toFixed(2)}.`,
    category: 'BILLING',
    timestamp: 'Just now',
    read: false,
    severity: 'INFO'
  });

  res.status(201).json(newInvoice);
});

app.post('/api/billing/process/:id', (req, res) => {
  const { id } = req.params;
  const index = billingInvoices.findIndex(b => b.id === id || b.invoiceNumber === id || b.tokenNumber === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Billing invoice not found' });
  }

  billingInvoices[index].status = 'PROCESSING';
  billingInvoices[index].patientsAhead = Math.max(0, billingInvoices[index].patientsAhead - 1);
  billingInvoices[index].estimatedTimeMins = 2;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: billingInvoices[index].mrn,
    title: 'Bill Being Processed',
    message: `Invoice ${billingInvoices[index].invoiceNumber} (Token #${billingInvoices[index].tokenNumber}) is currently being processed at ${billingInvoices[index].counter}.`,
    category: 'BILLING',
    timestamp: 'Just now',
    read: false,
    severity: 'INFO'
  });

  res.json(billingInvoices[index]);
});

app.post('/api/billing/pay/:id', (req, res) => {
  const { id } = req.params;
  const { paymentMethod = 'UPI', paymentReference } = req.body;

  const index = billingInvoices.findIndex(b => b.id === id || b.invoiceNumber === id || b.tokenNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = billingInvoices[index];
  const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  invoice.status = 'PAID';
  invoice.paymentMethod = paymentMethod;
  invoice.paymentReference = paymentReference || `${paymentMethod}-SIM-${Date.now().toString().slice(-6)}`;
  invoice.paidAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  invoice.receiptNumber = receiptNum;
  invoice.patientsAhead = 0;
  invoice.estimatedTimeMins = 0;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: invoice.mrn,
    title: 'Payment Completed',
    message: `Payment of $${invoice.amount.toFixed(2)} completed successfully via ${paymentMethod} for ${invoice.invoiceNumber}. Digital Receipt #${receiptNum} generated.`,
    category: 'BILLING',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.json({ message: 'Payment simulated successfully', invoice });
});

app.post('/api/billing/notify/:id', (req, res) => {
  const { id } = req.params;
  const { type = 'PENDING' } = req.body;

  const index = billingInvoices.findIndex(b => b.id === id || b.invoiceNumber === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const invoice = billingInvoices[index];
  let title = 'Billing Update';
  let message = `Invoice ${invoice.invoiceNumber} status is ${invoice.status}.`;
  let severity: 'INFO' | 'SUCCESS' | 'WARNING' = 'INFO';

  if (type === 'PENDING') {
    title = 'Payment Pending';
    message = `Payment of $${invoice.amount.toFixed(2)} for ${invoice.patientName} (Token #${invoice.tokenNumber}) is pending at ${invoice.counter}.`;
    severity = 'WARNING';
  } else if (type === 'DISCHARGE') {
    title = 'Discharge Billing Ready';
    message = `Discharge billing for ${invoice.patientName} (${invoice.mrn}) is finalized. Total payable: $${invoice.amount.toFixed(2)}.`;
    severity = 'INFO';
  }

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: invoice.mrn,
    title,
    message,
    category: 'BILLING',
    timestamp: 'Just now',
    read: false,
    severity
  });

  res.json({ message: 'Notification sent successfully', notificationTitle: title });
});

app.get('/api/locations', (req, res) => {
  res.json(hospitalLocations);
});

// Inter-staff Communication Messages
let staffMessages: Array<{
  id: string;
  senderRole: string;
  senderName: string;
  recipientRole: string; // 'NURSE' | 'PHARMACY' | 'ADMIN'
  subject: string;
  message: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED';
}> = [
  {
    id: 'msg-1',
    senderRole: 'DOCTOR',
    senderName: 'Dr. Aris Vance, MD',
    recipientRole: 'NURSE',
    subject: 'Stat Vitals Check for Room 102',
    message: 'Please re-check BP and SpO2 for David Miller before administering oral meds.',
    priority: 'HIGH',
    timestamp: '10:15 AM',
    status: 'DELIVERED'
  },
  {
    id: 'msg-2',
    senderRole: 'DOCTOR',
    senderName: 'Dr. Aris Vance, MD',
    recipientRole: 'PHARMACY',
    subject: 'Stat Discharge Prescription',
    message: 'Priority dispensing for patient David Miller (MRN-2026-8812). Amoxicillin substitute approved.',
    priority: 'URGENT',
    timestamp: '10:30 AM',
    status: 'ACKNOWLEDGED'
  },
  {
    id: 'msg-3',
    senderRole: 'DOCTOR',
    senderName: 'Dr. Aris Vance, MD',
    recipientRole: 'ADMIN',
    subject: 'OPD Slot Extension Request',
    message: 'Expecting 4 high-priority OPD patients. Requesting extension of OPD counter 102 till 03:30 PM.',
    priority: 'NORMAL',
    timestamp: '10:45 AM',
    status: 'SENT'
  }
];

app.get('/api/messages', (req, res) => {
  const { recipientRole } = req.query;
  if (recipientRole) {
    const filtered = staffMessages.filter(m => m.recipientRole === recipientRole || m.senderRole === recipientRole);
    return res.json(filtered);
  }
  res.json(staffMessages);
});

app.post('/api/messages', (req, res) => {
  const { senderRole, senderName, recipientRole, subject, message, priority } = req.body;
  const newMsg = {
    id: `msg-${Date.now()}`,
    senderRole: senderRole || 'DOCTOR',
    senderName: senderName || 'Dr. Aris Vance, MD',
    recipientRole: recipientRole || 'NURSE',
    subject: subject || 'Clinical Note',
    message: message || '',
    priority: priority || 'NORMAL',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENT' as const
  };
  staffMessages.unshift(newMsg);

  // Send system notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: 'MRN-SYSTEM',
    title: `New Message for ${recipientRole}`,
    message: `${newMsg.senderName}: ${newMsg.subject}`,
    category: 'DOCTOR_DELAY',
    timestamp: 'Just now',
    read: false,
    severity: priority === 'URGENT' ? 'CRITICAL' : 'INFO'
  });

  res.status(201).json(newMsg);
});

// Create Prescription Endpoint
app.post('/api/prescriptions', (req, res) => {
  const { mrn, patientName, doctorName, departmentName, diagnosis, medicines } = req.body;
  const newPrescription = {
    id: `rx-${Date.now()}`,
    prescriptionNumber: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    mrn: mrn || 'MRN-2026-8812',
    patientName: patientName || 'David Miller',
    doctorName: doctorName || 'Dr. Aris Vance, MD',
    departmentName: departmentName || 'General Medicine & OPD',
    date: new Date().toISOString().split('T')[0],
    medicines: medicines || [],
    diagnosis: diagnosis || 'General OPD Assessment',
    status: 'PRESCRIBED' as const
  };

  prescriptions.unshift(newPrescription);

  // Create pharmacy order automatically
  const tokenNum = `P-${105 + pharmacyOrders.length}`;
  const newPharmacyOrder = {
    id: `rx-ord-${Date.now()}`,
    orderNumber: newPrescription.prescriptionNumber,
    tokenNumber: tokenNum,
    patientName: newPrescription.patientName,
    mrn: newPrescription.mrn,
    prescribedBy: newPrescription.doctorName,
    itemsCount: newPrescription.medicines.length,
    medicines: newPrescription.medicines.map((m: any) => `${m.name} (${m.dosage})`),
    status: 'WAITING' as const,
    pickupCounter: 'Pharmacy Counter #2',
    patientsAhead: pharmacyOrders.filter(p => p.status === 'WAITING' || p.status === 'PREPARING').length,
    estimatedTimeMins: 10,
    issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isExpressPickup: newPrescription.medicines.length === 1,
    qrCode: `PHARM-QR-${Math.floor(1000 + Math.random() * 9000)}`,
    notes: 'Automatically created from doctor e-prescription.'
  };
  pharmacyOrders.unshift(newPharmacyOrder);

  // Send Notification
  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: newPrescription.mrn,
    title: 'New e-Prescription Created',
    message: `Prescription #${newPrescription.prescriptionNumber} for ${newPrescription.patientName} sent to Pharmacy.`,
    category: 'PHARMACY',
    timestamp: 'Just now',
    read: false,
    severity: 'SUCCESS'
  });

  res.status(201).json(newPrescription);
});

// Create Lab Order Endpoint
app.post('/api/lab-reports', (req, res) => {
  const { mrn, patientName, testName, category, orderedBy, metricsSummary } = req.body;
  const newLabOrder = {
    id: `lab-${Date.now()}`,
    reportNumber: `LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    mrn: mrn || 'MRN-2026-8812',
    patientName: patientName || 'David Miller',
    testName: testName || 'Complete Blood Count (CBC)',
    category: category || 'Hematology',
    orderedBy: orderedBy || 'Dr. Aris Vance, MD',
    orderDate: new Date().toISOString().split('T')[0],
    completedDate: '',
    status: 'ORDERED' as const,
    resultsSummary: metricsSummary || 'Sample pending collection at Diagnostic Lab Block B',
    isCritical: false,
    fileUrl: '',
    metrics: [
      { parameter: 'Hemoglobin (Hb)', result: 'Pending', normalRange: '13.5 - 17.5 g/dL', status: 'NORMAL' as const },
      { parameter: 'Total WBC Count', result: 'Pending', normalRange: '4,000 - 11,000 /mcL', status: 'NORMAL' as const }
    ]
  };

  labReports.unshift(newLabOrder);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    mrn: newLabOrder.mrn,
    title: 'Lab Test Requested',
    message: `Lab Test "${newLabOrder.testName}" ordered for ${newLabOrder.patientName}.`,
    category: 'LAB_REPORT',
    timestamp: 'Just now',
    read: false,
    severity: 'INFO'
  });

  res.status(201).json(newLabOrder);
});

// Nursing Tasks Endpoints
app.get('/api/nursing-tasks', (req, res) => {
  res.json(nursingTasks);
});

app.post('/api/nursing-tasks', (req, res) => {
  const { patientName, mrn, bedNumber, title, description, category, isUrgent, dueTime, assignedNurse } = req.body;
  const newTask = {
    id: `ntask-${Date.now()}`,
    patientName: patientName || 'Arthur Pendelton',
    mrn: mrn || 'MRN-2026-1049',
    bedNumber: bedNumber || 'ICU Bed 04',
    title: title || 'Routine Nursing Task',
    description: description || '',
    category: category || 'VITAL_CHECK',
    isUrgent: !!isUrgent,
    status: 'PENDING' as const,
    dueTime: dueTime || 'Immediate',
    assignedNurse: assignedNurse || 'Nurse Elena Rostova'
  };
  nursingTasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.patch('/api/nursing-tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = nursingTasks.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  nursingTasks[index] = { ...nursingTasks[index], ...req.body };
  res.json(nursingTasks[index]);
});

// Medication Tasks Endpoints
app.get('/api/medication-tasks', (req, res) => {
  res.json(medicationTasks);
});

app.patch('/api/medication-tasks/:id', (req, res) => {
  const { id } = req.params;
  const index = medicationTasks.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Medication task not found' });
  }
  medicationTasks[index] = { ...medicationTasks[index], ...req.body };
  res.json(medicationTasks[index]);
});

// Nursing Notes Endpoints
app.get('/api/nursing-notes', (req, res) => {
  res.json(nursingNotes);
});

app.post('/api/nursing-notes', (req, res) => {
  const { patientName, mrn, bedNumber, nurseName, category, note } = req.body;
  const newNote = {
    id: `nnote-${Date.now()}`,
    patientName: patientName || 'Arthur Pendelton',
    mrn: mrn || 'MRN-2026-1049',
    bedNumber: bedNumber || 'ICU Bed 04',
    nurseName: nurseName || 'Nurse Elena Rostova',
    category: category || 'SOAP_SUBJECTIVE',
    note: note || '',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
  nursingNotes.unshift(newNote);
  res.status(201).json(newNote);
});

app.get('/api/analytics', async (req, res) => {
  try {
    const { analyticsService } = await import('./src/services/analyticsService.js');
    const stats = await analyticsService.getHospitalAnalytics();
    res.json(stats);
  } catch (err: any) {
    res.json({
      totalPatients: 142,
      totalDoctors: 28,
      totalNurses: 45,
      activeQueuesCount: 6,
      tokensIssuedToday: 89,
      tokensCompletedToday: 72,
      averageWaitTimeMins: 12,
      todayRevenue: 3840.00,
      occupancyRatePercentage: 88,
      departmentStats: [
        { departmentName: 'General Medicine & OPD', doctorCount: 8, tokensIssued: 42 },
        { departmentName: 'Cardiology & Vascular', doctorCount: 5, tokensIssued: 18 },
        { departmentName: 'Pediatric & Child Care', doctorCount: 6, tokensIssued: 22 },
        { departmentName: 'Orthopedics & Joint Care', doctorCount: 4, tokensIssued: 15 }
      ]
    });
  }
});

// ==================== VITE MIDDLEWARE SETUP ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Hospital Connectivity server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
