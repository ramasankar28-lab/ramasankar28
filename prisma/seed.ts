import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function seedDatabase() {
  console.log('🌱 Starting Smart Hospital Connectivity database seed...');

  // 1. Seed Departments
  console.log(' Seeding Departments...');
  const deptGeneral = await prisma.department.upsert({
    where: { code: 'GM-OPD' },
    update: {},
    create: {
      id: 'dept-1',
      name: 'General Medicine & OPD',
      code: 'GM-OPD',
      floor: 'Ground Floor',
      wing: 'Block A',
      description: 'Primary health checks, adult medicine, fever, routine OPD consultations.',
      avgWaitTimeMins: 12,
      iconName: 'Stethoscope'
    }
  });

  const deptCardio = await prisma.department.upsert({
    where: { code: 'CARD' },
    update: {},
    create: {
      id: 'dept-2',
      name: 'Cardiology & Vascular',
      code: 'CARD',
      floor: '1st Floor',
      wing: 'Block B',
      description: 'Heart care, ECG, echo, hypertension, angina, cardiac checkups.',
      avgWaitTimeMins: 20,
      iconName: 'HeartPulse'
    }
  });

  const deptPedia = await prisma.department.upsert({
    where: { code: 'PED' },
    update: {},
    create: {
      id: 'dept-3',
      name: 'Pediatric & Child Care',
      code: 'PED',
      floor: '1st Floor',
      wing: 'Block C',
      description: 'Infant, child health, vaccination, pediatric emergencies.',
      avgWaitTimeMins: 10,
      iconName: 'Baby'
    }
  });

  const deptOrtho = await prisma.department.upsert({
    where: { code: 'ORTHO' },
    update: {},
    create: {
      id: 'dept-4',
      name: 'Orthopedics & Joint Care',
      code: 'ORTHO',
      floor: '2nd Floor',
      wing: 'Block A',
      description: 'Fractures, joint pains, bone care, trauma & spine OPD.',
      avgWaitTimeMins: 18,
      iconName: 'Activity'
    }
  });

  const deptDerm = await prisma.department.upsert({
    where: { code: 'DERM' },
    update: {},
    create: {
      id: 'dept-5',
      name: 'Dermatology & Skin',
      code: 'DERM',
      floor: '2nd Floor',
      wing: 'Block B',
      description: 'Skin disorders, allergies, cosmetic consultations.',
      avgWaitTimeMins: 15,
      iconName: 'Sparkles'
    }
  });

  const deptEnt = await prisma.department.upsert({
    where: { code: 'ENT' },
    update: {},
    create: {
      id: 'dept-6',
      name: 'ENT & Head-Neck',
      code: 'ENT',
      floor: '3rd Floor',
      wing: 'Block A',
      description: 'Ear, nose, throat consultations, audiometry, sinus care.',
      avgWaitTimeMins: 14,
      iconName: 'Ear'
    }
  });

  // 2. Seed Hospital Locations & Counters
  console.log('📍 Seeding Hospital Locations & Counters...');
  const locReg = await prisma.hospitalLocation.upsert({
    where: { id: 'loc-1' },
    update: {},
    create: {
      id: 'loc-1',
      name: 'Main Registration & Token Kiosk',
      category: 'REGISTRATION',
      floor: 'Ground Floor',
      wing: 'Central Atrium',
      directionSteps: ['Enter main hospital glass gate', 'Head straight 20 meters', 'Kiosk screens located opposite Helpdesk'],
      queueWaitMins: 2,
      activeCounters: 4,
      openHours: '24/7'
    }
  });

  const locOpd = await prisma.hospitalLocation.upsert({
    where: { id: 'loc-2' },
    update: {},
    create: {
      id: 'loc-2',
      name: 'General OPD & Consultations',
      category: 'OPD',
      floor: 'Ground Floor',
      wing: 'Block A',
      directionSteps: ['From atrium, turn left into Block A corridor', 'Rooms 101 to 115 are on the right side'],
      queueWaitMins: 12,
      activeCounters: 6,
      openHours: '08:00 AM - 08:00 PM'
    }
  });

  const locPharma = await prisma.hospitalLocation.upsert({
    where: { id: 'loc-3' },
    update: {},
    create: {
      id: 'loc-3',
      name: 'Central Pharmacy & Medicine Dispense',
      category: 'PHARMACY',
      floor: 'Ground Floor',
      wing: 'Block B (Near Exit)',
      directionSteps: ['Walk past Billing counters', 'Turn right towards Block B Exit', 'Express pickup counters #1-#4'],
      queueWaitMins: 5,
      activeCounters: 4,
      openHours: '24/7'
    }
  });

  const counterOpd102 = await prisma.hospitalCounter.upsert({
    where: { id: 'cntr-102' },
    update: {},
    create: {
      id: 'cntr-102',
      locationId: locOpd.id,
      departmentId: deptGeneral.id,
      counterNumber: 'Room 102',
      name: 'OPD Counter Room 102',
      category: 'DOCTOR_OPD',
      isOperational: true,
      currentOperatorName: 'Dr. Aris Vance, MD'
    }
  });

  // 3. Seed Users & Profiles
  console.log('👤 Seeding Users & Role Profiles...');

  // Admin User
  const saltAdmin = generateSalt();
  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin@smarthospital.org' },
    update: {},
    create: {
      email: 'admin@smarthospital.org',
      name: 'Administrator Console',
      role: 'ADMIN',
      salt: saltAdmin,
      passwordHash: hashPassword('Admin@123', saltAdmin),
      phone: '+1 (555) 000-1111'
    }
  });

  // Patient User & Profile
  const saltPat1 = generateSalt();
  const userPat1 = await prisma.user.upsert({
    where: { email: 'patient@smarthospital.org' },
    update: {},
    create: {
      email: 'patient@smarthospital.org',
      name: 'David Miller',
      role: 'PATIENT',
      salt: saltPat1,
      passwordHash: hashPassword('Patient@123', saltPat1),
      phone: '+1 (555) 234-5678',
      mrn: 'MRN-2026-8812',
      dob: '1988-05-14',
      gender: 'Male',
      address: '452 Medical Parkway, Suite 4B',
      emergencyContactName: 'Sarah Miller',
      emergencyContactPhone: '+1 (555) 999-8888',
      emergencyContactRelation: 'Spouse'
    }
  });

  const patientDavid = await prisma.patient.upsert({
    where: { userId: userPat1.id },
    update: {},
    create: {
      id: 'pat-001',
      userId: userPat1.id,
      mrn: 'MRN-2026-8812',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Dust Mites'],
      medicalHistory: 'Mild Hypertension, Seasonal Asthma',
      emergencyContact: 'Sarah Miller (+1 555-999-8888)'
    }
  });

  // Doctor User & Profile
  const saltDoc1 = generateSalt();
  const userDoc1 = await prisma.user.upsert({
    where: { email: 'doctor@smarthospital.org' },
    update: {},
    create: {
      email: 'doctor@smarthospital.org',
      name: 'Dr. Aris Vance, MD',
      role: 'DOCTOR',
      salt: saltDoc1,
      passwordHash: hashPassword('Doctor@123', saltDoc1),
      phone: '+1 (555) 111-2222'
    }
  });

  const docAris = await prisma.doctor.upsert({
    where: { userId: userDoc1.id },
    update: {},
    create: {
      id: 'doc-1',
      userId: userDoc1.id,
      name: 'Dr. Aris Vance, MD',
      specialization: 'Senior General Physician',
      qualification: 'MBBS, MD (Internal Medicine)',
      departmentId: deptGeneral.id,
      roomNumber: 'Room 102',
      maxDailyPatients: 35,
      avgConsultTimeMins: 8,
      isAvailable: true
    }
  });

  // Doctor Schedules
  await prisma.doctorSchedule.createMany({
    data: [
      { doctorId: docAris.id, dayOfWeek: 'MONDAY', startTime: '08:30 AM', endTime: '02:30 PM', maxPatients: 35 },
      { doctorId: docAris.id, dayOfWeek: 'WEDNESDAY', startTime: '08:30 AM', endTime: '02:30 PM', maxPatients: 35 },
      { doctorId: docAris.id, dayOfWeek: 'FRIDAY', startTime: '08:30 AM', endTime: '02:30 PM', maxPatients: 35 }
    ],
    skipDuplicates: true
  });

  // Nurse User & Profile
  const saltNurse1 = generateSalt();
  const userNurse1 = await prisma.user.upsert({
    where: { email: 'nurse@smarthospital.org' },
    update: {},
    create: {
      email: 'nurse@smarthospital.org',
      name: 'Nurse Elena Rostova',
      role: 'NURSE',
      salt: saltNurse1,
      passwordHash: hashPassword('Nurse@123', saltNurse1),
      phone: '+1 (555) 333-4444'
    }
  });

  const nurseElena = await prisma.nurse.upsert({
    where: { userId: userNurse1.id },
    update: {},
    create: {
      id: 'nurse-1',
      userId: userNurse1.id,
      name: 'Nurse Elena Rostova',
      departmentId: deptGeneral.id,
      ward: 'Ward Alpha - Station 1',
      station: 'Station A',
      isAvailable: true
    }
  });

  // Patient Attender User & Profile
  const saltAttender = generateSalt();
  const userAttender = await prisma.user.upsert({
    where: { email: 'attender@smarthospital.org' },
    update: {},
    create: {
      email: 'attender@smarthospital.org',
      name: 'Robert Martinez (Attender)',
      role: 'ATTENDER',
      salt: saltAttender,
      passwordHash: hashPassword('Attender@123', saltAttender),
      phone: '+1 (555) 555-6666'
    }
  });

  await prisma.patientAttender.upsert({
    where: { userId: userAttender.id },
    update: {},
    create: {
      userId: userAttender.id,
      name: 'Robert Martinez',
      patientId: patientDavid.id,
      phone: '+1 (555) 555-6666',
      relationship: 'Brother / Primary Caregiver'
    }
  });

  // Pharmacy Staff User & Profile
  const saltPharma = generateSalt();
  const userPharma = await prisma.user.upsert({
    where: { email: 'pharmacy@smarthospital.org' },
    update: {},
    create: {
      email: 'pharmacy@smarthospital.org',
      name: 'Chief Pharmacist Sanjeev',
      role: 'PHARMACY',
      salt: saltPharma,
      passwordHash: hashPassword('Pharmacy@123', saltPharma),
      phone: '+1 (555) 777-8888'
    }
  });

  await prisma.pharmacyStaff.upsert({
    where: { userId: userPharma.id },
    update: {},
    create: {
      userId: userPharma.id,
      name: 'Chief Pharmacist Sanjeev',
      counterNumber: 'Express Counter #2',
      shift: 'Morning (08:00 AM - 04:00 PM)',
      isAvailable: true
    }
  });

  // 4. Seed Medicine Inventory
  console.log('💊 Seeding Medicine Inventory...');
  const medAmox = await prisma.medicineInventory.upsert({
    where: { code: 'MED-AMX-500' },
    update: {},
    create: {
      code: 'MED-AMX-500',
      name: 'Amoxicillin 500mg Capsule',
      category: 'Antibiotic',
      brand: 'Amoxil Health',
      unit: 'Capsule',
      unitPrice: 1.50,
      stockQuantity: 450,
      reorderLevel: 50,
      expiryDate: '2027-12-31',
      manufacturer: 'PharmaCore International',
      location: 'Shelf B-12'
    }
  });

  const medPara = await prisma.medicineInventory.upsert({
    where: { code: 'MED-PCM-650' },
    update: {},
    create: {
      code: 'MED-PCM-650',
      name: 'Paracetamol 650mg Tablet',
      category: 'Analgesic & Antipyretic',
      brand: 'Calpol Forte',
      unit: 'Tablet',
      unitPrice: 0.50,
      stockQuantity: 1200,
      reorderLevel: 100,
      expiryDate: '2028-06-30',
      manufacturer: 'Apex Remedies',
      location: 'Shelf A-04'
    }
  });

  // 5. Seed Lab Tests
  console.log('🧪 Seeding Lab Tests...');
  const labCbc = await prisma.labTest.upsert({
    where: { code: 'LAB-CBC' },
    update: {},
    create: {
      code: 'LAB-CBC',
      name: 'Complete Blood Count (CBC) with Differential',
      category: 'Hematology',
      description: 'Measures RBC, WBC, Hemoglobin, Hematocrit, and Platelets',
      price: 25.00,
      normalRange: 'WBC: 4.5 - 11.0 k/uL, Hb: 13.5 - 17.5 g/dL',
      turnaroundHours: 4
    }
  });

  const labLft = await prisma.labTest.upsert({
    where: { code: 'LAB-LFT' },
    update: {},
    create: {
      code: 'LAB-LFT',
      name: 'Liver Function Panel (LFT)',
      category: 'Biochemistry',
      description: 'Assesses Bilirubin, ALT, AST, Alkaline Phosphatase, Protein',
      price: 45.00,
      normalRange: 'ALT: 7 - 56 U/L, AST: 10 - 40 U/L',
      turnaroundHours: 6
    }
  });

  // 6. Seed Lab Reports
  console.log('📋 Seeding Lab Reports...');
  await prisma.labReport.create({
    data: {
      patientId: patientDavid.id,
      doctorId: docAris.id,
      labTestId: labCbc.id,
      orderDate: '2026-08-11',
      sampleCollectedAt: '2026-08-11 08:30 AM',
      resultDate: '2026-08-11 12:15 PM',
      status: 'COMPLETED',
      testResults: 'WBC: 8.2 k/uL (Normal), Hb: 14.8 g/dL (Normal), Platelets: 280 k/uL (Normal)',
      remarks: 'All blood parameters within normal healthy range.',
      isCritical: false
    }
  });

  // 7. Seed Appointments & Queues
  console.log('📅 Seeding Appointments & Queue Tokens...');
  const appt1 = await prisma.appointment.create({
    data: {
      patientId: patientDavid.id,
      doctorId: docAris.id,
      departmentId: deptGeneral.id,
      date: '2026-08-12',
      timeSlot: '09:30 AM',
      type: 'OPD',
      status: 'CONFIRMED',
      symptoms: 'Mild fever and dry cough for 2 days'
    }
  });

  const queueMain = await prisma.queue.create({
    data: {
      departmentId: deptGeneral.id,
      doctorId: docAris.id,
      counterId: counterOpd102.id,
      date: '2026-08-12',
      currentTokenNo: 101,
      totalTokensIssued: 4,
      status: 'IN_CONSULTATION'
    }
  });

  const qEntry1 = await prisma.queueEntry.create({
    data: {
      queueId: queueMain.id,
      patientId: patientDavid.id,
      doctorId: docAris.id,
      tokenNumber: 'A-101',
      sequenceNo: 1,
      priority: 'NORMAL',
      status: 'IN_CONSULTATION',
      estimatedWaitMinutes: 0,
      issueTime: '09:10 AM',
      calledTime: '09:30 AM',
      counterNumber: 'Room 102'
    }
  });

  await prisma.token.create({
    data: {
      tokenNumber: 'A-101',
      sequenceNo: 1,
      priority: 'NORMAL',
      status: 'IN_CONSULTATION',
      estimatedWaitMinutes: 0,
      issueTime: '09:10 AM',
      calledTime: '09:30 AM',
      counterNumber: 'Room 102',
      departmentId: deptGeneral.id,
      doctorId: docAris.id,
      patientId: patientDavid.id,
      queueEntryId: qEntry1.id
    }
  });

  // 8. Seed Prescriptions
  console.log('📝 Seeding Prescriptions...');
  const prescription1 = await prisma.prescription.create({
    data: {
      patientId: patientDavid.id,
      doctorId: docAris.id,
      appointmentId: appt1.id,
      date: '2026-08-12',
      diagnosis: 'Acute Upper Respiratory Tract Infection',
      notes: 'Take rest, drink warm fluids, complete antibiotic course.',
      status: 'ISSUED',
      medicines: {
        create: [
          {
            inventoryId: medAmox.id,
            name: 'Amoxicillin 500mg Capsule',
            dosage: '1 capsule',
            frequency: 'Three times daily (TDS)',
            durationDays: 5,
            quantity: 15
          },
          {
            inventoryId: medPara.id,
            name: 'Paracetamol 650mg Tablet',
            dosage: '1 tablet',
            frequency: 'As needed for fever (PRN)',
            durationDays: 3,
            quantity: 10
          }
        ]
      }
    }
  });

  // 9. Seed Vitals
  console.log('🩺 Seeding Vital Signs...');
  await prisma.vitalSign.create({
    data: {
      patientId: patientDavid.id,
      nurseId: nurseElena.id,
      spO2: 98,
      heartRate: 78,
      bpSystolic: 122,
      bpDiastolic: 80,
      temperature: 37.2,
      respiratoryRate: 16,
      alertStatus: 'STABLE',
      bedNumber: 'OPD Check Room 1',
      ward: 'Outpatient Triage',
      notes: 'Patient resting comfortably. Vitals stable.'
    }
  });

  // 10. Seed Bills & Payments
  console.log('💳 Seeding Bills & Payments...');
  const bill1 = await prisma.bill.create({
    data: {
      patientId: patientDavid.id,
      billNumber: 'INV-2026-0081',
      totalAmount: 60.00,
      discountAmount: 10.00,
      taxAmount: 0.00,
      netAmount: 50.00,
      status: 'PAID',
      dueDate: '2026-08-12',
      serviceType: 'OPD Consultation & Pharmacy',
      notes: 'Paid via Express UPI Payment'
    }
  });

  await prisma.payment.create({
    data: {
      billId: bill1.id,
      paymentNumber: 'PAY-2026-9901',
      amount: 50.00,
      paymentMethod: 'UPI',
      paymentStatus: 'SUCCESS',
      transactionRef: 'UPI/20260812/990182741'
    }
  });

  // 11. Seed Notifications & Messages
  console.log('🔔 Seeding Notifications & Internal Messages...');
  await prisma.notification.create({
    data: {
      userId: userPat1.id,
      title: 'Token A-101 Called',
      message: 'Your OPD Token A-101 has been called to Room 102 (Dr. Aris Vance, MD)',
      type: 'QUEUE_ALERT',
      isRead: true,
      link: '/patient/dashboard'
    }
  });

  await prisma.message.create({
    data: {
      senderId: userDoc1.id,
      receiverId: userNurse1.id,
      subject: 'Lab test follow up for David Miller',
      body: 'Hi Nurse Elena, please check CBC test results for patient David Miller before prescribing rest.',
      status: 'READ'
    }
  });

  console.log('✅ Database seeding completed successfully!');
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seedDatabase()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('❌ Error during seeding:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
