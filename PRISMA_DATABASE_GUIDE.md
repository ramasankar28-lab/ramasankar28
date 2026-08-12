# Smart Hospital Connectivity — Database & Backend Architecture Guide

This document provides instructions on the PostgreSQL database structure, Prisma ORM schema, migrations, seeding, and backend service modules.

---

## 1. Database Overview & Models

The application uses **Prisma ORM** mapped to PostgreSQL tables:

### Core Models & Primary Responsibilities
- **`User`**: Base identity account for all 6 hospital roles (`ADMIN`, `PATIENT`, `DOCTOR`, `NURSE`, `ATTENDER`, `PHARMACY`). Stores cryptographic salt & password hashes.
- **`Patient`**: Medical profile linked to `User`, containing MRN, blood group, allergies, medical history, and emergency contacts.
- **`Doctor`**: Medical practitioner profile with specialization, department assignment, room number, and daily patient quotas.
- **`Nurse`**: Nursing staff profile linked to wards, stations, and departments.
- **`PatientAttender`**: Family member or primary caregiver tied to a specific `Patient`.
- **`PharmacyStaff`**: Pharmacy counter operator and shift schedule details.
- **`Department`**: Hospital clinical departments (e.g. General Medicine, Cardiology, Pediatrics) with average wait times and floor locations.
- **`HospitalLocation`**: Physical hospital areas (e.g. Registration Kiosk, OPD, Central Pharmacy) with wayfinding step instructions.
- **`Appointment`**: OPD and follow-up consultation bookings between `Patient` and `Doctor`.
- **`Queue`**: Active daily token queues assigned to departments/doctors.
- **`QueueEntry`**: Sequential waiting list items with priority levels (`NORMAL`, `SENIOR_CITIZEN`, `EMERGENCY`, `PREGNANT_OR_DISABLED`).
- **`Token`**: Patient OPD ticket tracking real-time status (`WAITING`, `CALLING`, `IN_CONSULTATION`, `COMPLETED`, `SKIPPED`).
- **`Prescription`**: Digital prescription issued by a `Doctor` containing list of `Medicine` items.
- **`Medicine`**: Prescribed medication details linked to `Prescription` and optional `MedicineInventory`.
- **`MedicineInventory`**: Stock tracking, unit prices, reorder levels, and shelf locations.
- **`LabTest`**: Catalog of diagnostic lab tests (e.g. CBC, LFT) with normal ranges and turnaround times.
- **`LabReport`**: Test order and diagnostic results linked to `Patient`, `Doctor`, and `LabTest`.
- **`Bill`**: Invoices with total, discount, tax, and net amounts.
- **`Payment`**: Payment transactions (UPI, Cash, Card, Insurance) linked to a `Bill`.
- **`Notification`**: System and OPD queue alerts delivered to `User`.
- **`Message`**: Internal messaging between doctors, nurses, and hospital staff.
- **`PatientRecord`**: Clinical consultation notes, diagnoses, and medical record history.
- **`VitalSign`**: Patient telemetry records (SpO2, Heart Rate, BP, Temp) with automated status calculations (`STABLE`, `WARNING`, `CRITICAL`).
- **`NurseTask`**: Bedside nursing checklist and task queue.
- **`DoctorSchedule`**: Daily consultation availability schedules.
- **`StaffShift`**: Shift rosters for nurses, doctors, and pharmacy operators.
- **`HospitalCounter`**: Physical counters mapped to locations and departments.
- **`QueueHistory`**: Historical analytics logs of completed queue consultations.

---

## 2. Running Prisma Migrations & Seeding

### Prerequisites
Make sure your PostgreSQL database connection string is configured in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/smarthospital?schema=public"
```

### Generating Prisma Client
```bash
npx prisma generate
# or
npm run prisma:generate
```

### Running Database Migrations
To create and apply PostgreSQL schema migrations:
```bash
npx prisma migrate dev --name init
# or
npm run prisma:migrate
```

### Seeding Fictional Data
To populate the database with pre-configured departments, doctors, nurses, patients, medicine inventory, appointments, and tokens:
```bash
npx prisma db seed
# or
npm run seed
```

---

## 3. Backend Service Architecture (`/src/services/`)

The backend is structured into modular service files with input validation and error handling:

- **`patientService.ts`**: Patient profiles, MRN lookups, and medical histories.
- **`doctorService.ts`**: Doctor listings, department lookups, and room availability.
- **`nurseService.ts`**: Vital sign telemetry recording with automated `STABLE`/`WARNING`/`CRITICAL` classification and nurse task updates.
- **`appointmentService.ts`**: Appointment creation and status management.
- **`queueTokenService.ts`**: OPD token generation with sequence numbering, wait-time estimation, and caller controls.
- **`pharmacyService.ts`**: E-prescription issuance and inventory lookups.
- **`labService.ts`**: Diagnostic test ordering and critical result flagging.
- **`billingService.ts`**: Invoicing and payment processing.
- **`notificationService.ts`**: Alert notifications for token updates.
- **`messageService.ts`**: Internal staff messaging.
- **`patientRecordService.ts`**: Clinical record updates.
- **`analyticsService.ts`**: Real-time hospital metrics, token throughput, and revenue calculations.
