import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import {
  Users,
  Search,
  Navigation,
  MapPin,
  Compass,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Coffee,
  Heart,
  Info,
  Bell,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Wifi,
  ChevronRight,
  RefreshCw,
  FileText,
  Pill,
  CreditCard,
  Stethoscope,
  TestTube,
  UserCheck,
  BedDouble,
  Smartphone,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface AttenderDashboardProps {
  onNavigateTab: (tab: string) => void;
}

// Patient Journey Pipeline Stages
export type JourneyStep = 'REGISTRATION' | 'OPD' | 'DOCTOR' | 'LABORATORY' | 'PHARMACY' | 'BILLING' | 'COMPLETION';

export interface ConnectedPatient {
  visitCode: string;
  mrn: string;
  patientName: string;
  age: number;
  gender: string;
  doctorName: string;
  department: string;
  currentLocation: string;
  floorBlock: string;
  currentToken: string;
  currentStatus: string;
  nextStep: string;
  estimatedWaitMinutes: number;
  activeJourneyStep: JourneyStep;
  timeline: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
    active: boolean;
  }[];
}

// Pre-configured Patient Profiles for Instant Connection
const MOCK_PATIENTS: Record<string, ConnectedPatient> = {
  'VISIT-8812': {
    visitCode: 'VISIT-8812',
    mrn: 'MRN-2026-8812',
    patientName: 'David Miller',
    age: 54,
    gender: 'Male',
    doctorName: 'Dr. Aris Vance, MD',
    department: 'Cardiology & OPD',
    currentLocation: 'Consultation Room 102',
    floorBlock: 'Block A, Ground Floor (Near Helpdesk)',
    currentToken: 'A-101',
    currentStatus: 'Patient is currently in consultation with Dr. Vance',
    nextStep: 'Proceed to Pathology Laboratory Counter #4 for STAT Troponin Draw',
    estimatedWaitMinutes: 5,
    activeJourneyStep: 'DOCTOR',
    timeline: [
      { title: 'Registration & Token Issue', description: 'Kiosk Check-in & Vitals Triage completed', time: '08:30 AM', completed: true, active: false },
      { title: 'OPD Queue Assignment', description: 'Token #A-101 assigned to Cardiology OPD', time: '08:45 AM', completed: true, active: false },
      { title: 'Doctor Consultation', description: 'Currently inside Room 102 with Dr. Aris Vance', time: '09:15 AM', completed: false, active: true },
      { title: 'Laboratory Diagnostics', description: 'STAT Troponin I & Lipid Profile Test', time: 'Pending', completed: false, active: false },
      { title: 'Pharmacy Dispensary', description: 'E-Prescription order fulfilment', time: 'Pending', completed: false, active: false },
      { title: 'Cashier & Insurance Billing', description: 'Final invoice clearance', time: 'Pending', completed: false, active: false },
      { title: 'Completion & Discharge', description: 'Follow-up appointment summary', time: 'Pending', completed: false, active: false }
    ]
  },
  'VISIT-1049': {
    visitCode: 'VISIT-1049',
    mrn: 'MRN-2026-1049',
    patientName: 'Arthur Pendelton',
    age: 68,
    gender: 'Male',
    doctorName: 'Dr. Sarah Jenkins, MD',
    department: 'Pulmonology & ICU',
    currentLocation: 'Pathology Lab Counter #4',
    floorBlock: 'Block B, 1st Floor (Elevator B)',
    currentToken: 'B-204',
    currentStatus: 'Patient is waiting for laboratory blood sample collection',
    nextStep: 'Await Laboratory report preparation (~15 mins)',
    estimatedWaitMinutes: 12,
    activeJourneyStep: 'LABORATORY',
    timeline: [
      { title: 'Registration & Token Issue', description: 'Checked in at Front Desk', time: '09:00 AM', completed: true, active: false },
      { title: 'OPD Queue Assignment', description: 'Token #B-204 assigned', time: '09:15 AM', completed: true, active: false },
      { title: 'Doctor Consultation', description: 'Consultation with Dr. Jenkins complete', time: '09:40 AM', completed: true, active: false },
      { title: 'Laboratory Diagnostics', description: 'Blood Sample drawn at Pathology Counter 4', time: '10:05 AM', completed: false, active: true },
      { title: 'Pharmacy Dispensary', description: 'Inhaler & Antibiotic medication prep', time: 'Pending', completed: false, active: false },
      { title: 'Cashier & Insurance Billing', description: 'Co-pay settlement', time: 'Pending', completed: false, active: false },
      { title: 'Completion & Discharge', description: 'Discharge care instructions provided', time: 'Pending', completed: false, active: false }
    ]
  },
  'VISIT-3302': {
    visitCode: 'VISIT-3302',
    mrn: 'MRN-2026-3302',
    patientName: 'Beatrix Thorne',
    age: 42,
    gender: 'Female',
    doctorName: 'Dr. Marcus Lee, MD',
    department: 'General Surgery & OPD',
    currentLocation: 'Central Pharmacy Counter #2',
    floorBlock: 'Block C, Ground Floor Dispensary',
    currentToken: 'C-308',
    currentStatus: 'Prescription is ready for medicine pickup at Pharmacy',
    nextStep: 'Collect medicine package from Counter 2 and proceed to Billing',
    estimatedWaitMinutes: 3,
    activeJourneyStep: 'PHARMACY',
    timeline: [
      { title: 'Registration & Token Issue', description: 'Online appointment verified', time: '08:00 AM', completed: true, active: false },
      { title: 'OPD Queue Assignment', description: 'Token #C-308 issued', time: '08:15 AM', completed: true, active: false },
      { title: 'Doctor Consultation', description: 'Post-op dressing check completed', time: '08:45 AM', completed: true, active: false },
      { title: 'Laboratory Diagnostics', description: 'No lab tests required', time: 'Skipped', completed: true, active: false },
      { title: 'Pharmacy Dispensary', description: 'Medicines boxed and waiting at Counter 2', time: '09:10 AM', completed: false, active: true },
      { title: 'Cashier & Insurance Billing', description: 'Invoice #INV-2026-904 ready', time: 'Pending', completed: false, active: false },
      { title: 'Completion & Discharge', description: 'Hospital exit pass', time: 'Pending', completed: false, active: false }
    ]
  }
};

// Hospital Navigation Locations Directory
const HOSPITAL_NAV_DIRECTORY = [
  { category: 'DOCTOR', name: 'Dr. Aris Vance, MD (Cardiology)', location: 'Room 102, Block A - Ground Floor', floor: 'Ground Floor', waitTime: '3 mins' },
  { category: 'DOCTOR', name: 'Dr. Sarah Jenkins, MD (Pulmonology)', location: 'Room 204, Block B - 1st Floor', floor: '1st Floor', waitTime: '8 mins' },
  { category: 'DOCTOR', name: 'Dr. Marcus Lee, MD (General Surgery)', location: 'Room 108, Block A - Ground Floor', floor: 'Ground Floor', waitTime: '5 mins' },
  { category: 'DEPARTMENT', name: 'Cardiology & ECG Suite', location: 'Block A - Ground Floor (East Wing)', floor: 'Ground Floor', waitTime: '10 mins' },
  { category: 'DEPARTMENT', name: 'Orthopedics & Fracture Clinic', location: 'Block B - 2nd Floor (West Wing)', floor: '2nd Floor', waitTime: '12 mins' },
  { category: 'DEPARTMENT', name: 'Pediatrics & Neonatal Care', location: 'Block B - 1st Floor', floor: '1st Floor', waitTime: '6 mins' },
  { category: 'WARD', name: 'Ward 3B - Cardiac & Med-Surg', location: 'Block B - 3rd Floor', floor: '3rd Floor', waitTime: 'N/A' },
  { category: 'WARD', name: 'ICU / Critical Care Unit A', location: 'Block C - 2nd Floor', floor: '2nd Floor', waitTime: 'Restricted' },
  { category: 'LABORATORY', name: 'Pathology & Blood Draw Counter 4', location: 'Block B - 1st Floor', floor: '1st Floor', waitTime: '10 mins' },
  { category: 'LABORATORY', name: 'Radiology (X-Ray, CT Scan, MRI)', location: 'Block A - Basement Level -1', floor: 'Basement -1', waitTime: '15 mins' },
  { category: 'PHARMACY', name: 'OPD Central Pharmacy Counter 2', location: 'Block C - Ground Floor Dispensary', floor: 'Ground Floor', waitTime: '4 mins' },
  { category: 'PHARMACY', name: '24/7 Emergency Pharmacy', location: 'Main Entrance - Left Wing', floor: 'Ground Floor', waitTime: '2 mins' },
  { category: 'BILLING', name: 'Cashier Counter 1 & Billing Desk', location: 'Main Lobby - Block A Ground Floor', floor: 'Ground Floor', waitTime: '5 mins' },
  { category: 'BILLING', name: 'Insurance Desk & TPA Desk B', location: 'Main Lobby - Block A Ground Floor', floor: 'Ground Floor', waitTime: '8 mins' },
  { category: 'EMERGENCY', name: 'ER Triage & Trauma Bay 1', location: 'Emergency Wing Entrance (Red Signboard)', floor: 'Ground Floor', waitTime: 'STAT Immediate' },
  { category: 'WAITING', name: 'Central Family Waiting Lounge', location: 'Block A - Ground Floor (With Cafeteria & Wi-Fi)', floor: 'Ground Floor', waitTime: 'Open Seating' }
];

export function AttenderDashboard({ onNavigateTab }: AttenderDashboardProps) {
  const { user } = useAuth();

  // Connected Patient State
  const [inputVisitCode, setInputVisitCode] = useState('VISIT-8812');
  const [patient, setPatient] = useState<ConnectedPatient>(MOCK_PATIENTS['VISIT-8812']);
  const [connectSuccessMsg, setConnectSuccessMsg] = useState<string | null>(null);

  // Search & Navigation Filter
  const [navSearch, setNavSearch] = useState('');
  const [selectedNavCategory, setSelectedNavCategory] = useState<string>('ALL');
  const [selectedLocationDetail, setSelectedLocationDetail] = useState<any | null>(null);

  // Active View Tab inside Attender Dashboard
  const [dashboardTab, setDashboardTab] = useState<'STATUS' | 'JOURNEY' | 'NAVIGATION' | 'NOTIFICATIONS' | 'AMENITIES'>('STATUS');

  // Real-time Push Notifications Log
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Patient has entered consultation.', body: 'David Miller has called into Consultation Room 102 with Dr. Aris Vance.', time: '09:15 AM', type: 'INFO', unread: true },
    { id: '2', title: 'Patient is waiting for laboratory.', body: 'Doctor has ordered STAT Troponin I test. Patient directed to Lab Counter #4.', time: '09:28 AM', type: 'WARNING', unread: fontUnread('2') },
    { id: '3', title: 'Laboratory report is ready.', body: 'Troponin pathology result uploaded to EHR. No critical abnormalities detected.', time: '09:40 AM', type: 'SUCCESS', unread: false },
    { id: '4', title: 'Prescription has been sent to pharmacy.', body: 'Dr. Vance issued e-prescription #RX-992. Order transmitted to Pharmacy Counter 2.', time: '09:45 AM', type: 'INFO', unread: false },
    { id: '5', title: 'Medicine is ready for pickup.', body: 'Prescription package ready at Pharmacy Counter 2. Please bring Visit Code VISIT-8812.', time: '09:52 AM', type: 'SUCCESS', unread: false },
    { id: '6', title: 'Billing is ready.', body: 'Invoice #INV-2026-8812 generated. Total amount clear. Insurance co-pay processed.', time: '09:58 AM', type: 'SUCCESS', unread: false }
  ]);

  function fontUnread(id: string) {
    return id === '1';
  }

  // Sync live patient state from backend API
  const refreshLivePatientStatus = async (mrnOrCode: string) => {
    try {
      const queueList = await hospitalService.getSmartQueue();
      const notifs = await hospitalService.getNotifications(mrnOrCode);
      const billsData = await hospitalService.getBillingInvoices();

      if (notifs && notifs.length > 0) {
        setNotifications(
          notifs.map((n: any, idx: number) => ({
            id: n.id || String(idx),
            title: n.title,
            body: n.message,
            time: n.timestamp,
            type: n.severity === 'SUCCESS' ? 'SUCCESS' : n.severity === 'WARNING' ? 'WARNING' : 'INFO',
            unread: !n.read
          }))
        );
      }

      // Check if patient matches queue
      const activeQueue = queueList.find(
        (q: any) =>
          q.mrn?.toUpperCase() === mrnOrCode.toUpperCase() ||
          q.tokenNumber?.toUpperCase() === mrnOrCode.toUpperCase() ||
          mrnOrCode.includes('8812')
      );

      const activeInvoice = (billsData?.invoices || []).find(
        (b: any) => b.mrn?.toUpperCase() === mrnOrCode.toUpperCase() || b.tokenNumber?.toUpperCase() === mrnOrCode.toUpperCase()
      );

      if (activeQueue) {
        let step: JourneyStep = 'OPD';
        if (activeQueue.department === 'Registration') step = 'REGISTRATION';
        else if (activeQueue.department === 'Laboratory') step = 'LABORATORY';
        else if (activeQueue.department === 'Pharmacy') step = 'PHARMACY';
        else if (activeQueue.department === 'Billing' || activeInvoice) step = 'BILLING';

        if (activeQueue.status === 'COMPLETED' || activeInvoice?.status === 'PAID') {
          step = 'COMPLETION';
        }

        setPatient(prev => ({
          ...prev,
          patientName: activeQueue.patientName || prev.patientName,
          mrn: activeQueue.mrn || prev.mrn,
          currentToken: activeQueue.tokenNumber || prev.currentToken,
          currentLocation: activeQueue.counterNumber || activeQueue.serviceProvider || prev.currentLocation,
          estimatedWaitMinutes: activeQueue.estimatedWaitMinutes ?? prev.estimatedWaitMinutes,
          activeJourneyStep: step,
          currentStatus: `Patient status: ${activeQueue.status} at ${activeQueue.department}`
        }));
      }
    } catch {
      // Fallback to local state if offline
    }
  };

  useEffect(() => {
    refreshLivePatientStatus(patient.visitCode || patient.mrn);
  }, []);

  // Connect to a new patient via code
  const handleConnectPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputVisitCode.trim().toUpperCase();
    if (MOCK_PATIENTS[cleanCode]) {
      setPatient(MOCK_PATIENTS[cleanCode]);
      setConnectSuccessMsg(`Successfully connected to patient ${MOCK_PATIENTS[cleanCode].patientName} (${cleanCode})`);
      await refreshLivePatientStatus(cleanCode);
    } else {
      // Create fallback connected patient card for custom entered codes
      const customPatient: ConnectedPatient = {
        visitCode: cleanCode || 'VISIT-NEW',
        mrn: cleanCode.startsWith('MRN') ? cleanCode : `MRN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: 'Connected Patient',
        age: 38,
        gender: 'Adult',
        doctorName: 'Dr. Aris Vance, MD',
        department: 'General OPD',
        currentLocation: 'Waiting Lounge Block A',
        floorBlock: 'Ground Floor',
        currentToken: cleanCode.startsWith('A') ? cleanCode : 'REG-101',
        currentStatus: 'Patient is registered and waiting for queue',
        nextStep: 'Proceed to department counter when token is called',
        estimatedWaitMinutes: 5,
        activeJourneyStep: 'REGISTRATION',
        timeline: [
          { title: 'Registration & Token Issue', description: 'Check-in completed', time: '10:00 AM', completed: true, active: false },
          { title: 'OPD Queue Assignment', description: 'Token assigned', time: '10:15 AM', completed: false, active: true },
          { title: 'Doctor Consultation', description: 'Pending doctor call', time: 'Pending', completed: false, active: false },
          { title: 'Laboratory Diagnostics', description: 'If ordered by doctor', time: 'Pending', completed: false, active: false },
          { title: 'Pharmacy Dispensary', description: 'Prescription prep', time: 'Pending', completed: false, active: false },
          { title: 'Cashier & Insurance Billing', description: 'Payment settlement', time: 'Pending', completed: false, active: false },
          { title: 'Completion & Discharge', description: 'Visit exit', time: 'Pending', completed: false, active: false }
        ]
      };
      setPatient(customPatient);
      setConnectSuccessMsg(`Connected visit code ${cleanCode}`);
      await refreshLivePatientStatus(cleanCode);
    }

    setTimeout(() => setConnectSuccessMsg(null), 4000);
  };

  // Filter Navigation Items
  const filteredNavLocations = HOSPITAL_NAV_DIRECTORY.filter(item => {
    const matchesCategory = selectedNavCategory === 'ALL' || item.category === selectedNavCategory;
    const matchesSearch = item.name.toLowerCase().includes(navSearch.toLowerCase()) ||
                          item.location.toLowerCase().includes(navSearch.toLowerCase()) ||
                          item.floor.toLowerCase().includes(navSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate Journey Progress Percentage
  const journeyStepsList: { key: JourneyStep; label: string; icon: any }[] = [
    { key: 'REGISTRATION', label: 'Registration', icon: FileText },
    { key: 'OPD', label: 'OPD Queue', icon: Clock },
    { key: 'DOCTOR', label: 'Doctor', icon: Stethoscope },
    { key: 'LABORATORY', label: 'Laboratory', icon: TestTube },
    { key: 'PHARMACY', label: 'Pharmacy', icon: Pill },
    { key: 'BILLING', label: 'Billing', icon: CreditCard },
    { key: 'COMPLETION', label: 'Completion', icon: CheckCircle2 }
  ];

  const currentStepIndex = journeyStepsList.findIndex(s => s.key === patient.activeJourneyStep);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification Banner */}
      {connectSuccessMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-amber-500/40 flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{connectSuccessMsg}</span>
        </div>
      )}

      {/* Attender Welcome Banner & Connection Bar */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Patient Attender & Family Companion Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {user?.name || 'Robert Martinez (Patient Companion)'}
          </h1>
          <p className="text-xs sm:text-sm text-amber-100/80 mt-1">
            Connected to: <strong className="text-amber-300 font-bold">{patient.patientName}</strong> ({patient.visitCode} &bull; {patient.mrn})
          </p>
        </div>

        {/* Secure Code Quick Connection Form */}
        <form onSubmit={handleConnectPatient} className="bg-slate-900/90 p-2.5 rounded-xl border border-amber-500/30 flex items-center gap-2 w-full lg:w-auto shadow-inner">
          <div className="relative flex-1 sm:w-52">
            <QrCode className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Enter Visit Code (e.g. VISIT-8812)"
              value={inputVisitCode}
              onChange={(e) => setInputVisitCode(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 text-amber-200 placeholder-slate-400 rounded-lg focus:outline-none focus:border-amber-500 font-mono font-bold uppercase"
              required
            />
          </div>
          <Button type="submit" variant="teal" size="sm" className="bg-amber-600 hover:bg-amber-700 border-amber-500 text-white text-xs font-bold whitespace-nowrap">
            Link Patient
          </Button>
        </form>
      </div>

      {/* Preset Patient Connection Quick Select Strip */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-semibold">
          <ShieldCheck className="w-4 h-4 text-amber-600" />
          <span>Quick Connect Patient Demo Codes:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(MOCK_PATIENTS).map(code => (
            <button
              key={code}
              onClick={() => {
                setInputVisitCode(code);
                setPatient(MOCK_PATIENTS[code]);
                setConnectSuccessMsg(`Switched view to ${MOCK_PATIENTS[code].patientName} (${code})`);
                setTimeout(() => setConnectSuccessMsg(null), 3000);
              }}
              className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold transition-all ${
                patient.visitCode === code
                  ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {code} &bull; {MOCK_PATIENTS[code].patientName}
            </button>
          ))}
        </div>
      </div>

      {/* DASHBOARD NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setDashboardTab('STATUS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            dashboardTab === 'STATUS' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Live Patient Status</span>
        </button>

        <button
          onClick={() => setDashboardTab('JOURNEY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            dashboardTab === 'JOURNEY' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Hospital Journey ({currentStepIndex + 1}/7)</span>
        </button>

        <button
          onClick={() => setDashboardTab('NAVIGATION')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            dashboardTab === 'NAVIGATION' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Hospital Map & Directory</span>
        </button>

        <button
          onClick={() => setDashboardTab('NOTIFICATIONS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            dashboardTab === 'NOTIFICATIONS' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Live Updates ({notifications.length})</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-1 animate-ping" />
        </button>

        <button
          onClick={() => setDashboardTab('AMENITIES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            dashboardTab === 'AMENITIES' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Attender Amenities & Rest Areas</span>
        </button>
      </div>

      {/* TAB 1: LIVE PATIENT STATUS & LOCATION */}
      {dashboardTab === 'STATUS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Status & Token Card */}
          <div className="lg:col-span-8 space-y-6">
            {/* Live Location Spotlight Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-amber-600" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Patient Live Location & Status</h2>
                    <p className="text-xs text-slate-500">Real-time room tracking eliminating the need to ask staff</p>
                  </div>
                </div>
                <Badge variant="success" className="animate-pulse">Active In Hospital</Badge>
              </div>

              {/* High Contrast Token & Location Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-inner space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest block font-bold">Active Queue Token</span>
                    <div className="text-4xl font-black text-amber-400 font-mono mt-1">
                      #{patient.currentToken}
                    </div>
                  </div>

                  <div className="sm:text-right bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Est. Waiting Time</span>
                    <div className="text-lg font-extrabold text-emerald-400 flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4" />
                      <span>~{patient.estimatedWaitMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Patient Name:</span>
                    <span className="font-extrabold text-white text-sm">{patient.patientName} ({patient.age}y &bull; {patient.gender})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Consulting Doctor:</span>
                    <span className="font-extrabold text-white text-sm">{patient.doctorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Current Room / Counter:</span>
                    <span className="font-bold text-teal-300">{patient.currentLocation}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Building Block & Floor:</span>
                    <span className="font-semibold text-slate-200">{patient.floorBlock}</span>
                  </div>
                </div>
              </div>

              {/* Status Alert & Next Action Step */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Current Patient Status</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium">{patient.currentStatus}</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                    <ArrowRight className="w-4 h-4 text-emerald-600" />
                    <span>Next Expected Step</span>
                  </div>
                  <p className="text-xs text-emerald-800 font-medium">{patient.nextStep}</p>
                </div>
              </div>
            </div>

            {/* Quick Attender Guidance Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" /> Attender Convenience Checklist
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>No need to stand in line:</strong> Monitor the token number live from the Central Waiting Lounge.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Prescription Sync:</strong> As soon as the doctor issues an e-prescription, you will receive an automatic pickup notification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Wheelchair & Assistance:</strong> Free wheelchair escorts are available at the Main Entrance Lobby.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Sidebar: Quick Navigation & Live Alerts */}
          <div className="lg:col-span-4 space-y-6">
            {/* Real-Time Live Activity Stream */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600" /> Live Updates Stream
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Auto-Sync</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {notifications.slice(0, 4).map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">{n.body}</p>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDashboardTab('NOTIFICATIONS')}
                className="w-full text-xs"
              >
                View Full Alert Log
              </Button>
            </div>

            {/* Hospital Wayfinder Quick Link */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl p-5 shadow-lg space-y-3">
              <Compass className="w-8 h-8 text-amber-200" />
              <div>
                <h3 className="font-extrabold text-base">Hospital Wayfinder</h3>
                <p className="text-xs text-amber-100/90 mt-1">Locate Pharmacy, Cashier, Doctor Suites, and Restrooms across all building wings.</p>
              </div>
              <Button
                onClick={() => setDashboardTab('NAVIGATION')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white border-none text-xs font-bold py-2"
              >
                Open Hospital Directory & Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOSPITAL JOURNEY PIPELINE */}
      {dashboardTab === 'JOURNEY' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-amber-600" /> Patient Hospital Journey Map
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Sequential OPD workflow tracking from check-in to completion.</p>
              </div>

              <Badge variant="teal" className="text-xs font-mono font-bold">
                Step {currentStepIndex + 1} of 7 Active
              </Badge>
            </div>
          </div>

          {/* VISUAL PIPELINE FLOW BAR */}
          <div className="overflow-x-auto pb-4">
            <div className="min-w-[700px] flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0" />
              <div
                className="absolute top-5 left-8 h-1 bg-amber-500 transition-all duration-500 -z-0"
                style={{ width: `${(currentStepIndex / (journeyStepsList.length - 1)) * 90}%` }}
              />

              {journeyStepsList.map((step, idx) => {
                const IconComp = step.icon;
                const isCompleted = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;

                return (
                  <div key={step.key} className="relative z-10 flex flex-col items-center text-center w-24">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                        isCompleted
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : isActive
                          ? 'bg-amber-600 text-white ring-4 ring-amber-200 animate-bounce'
                          : 'bg-slate-100 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <IconComp className="w-4 h-4" />}
                    </div>

                    <span className={`text-[11px] font-bold mt-2 block ${isActive ? 'text-amber-900 font-extrabold' : isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </span>

                    {isActive && (
                      <span className="text-[9px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold mt-0.5">
                        In Progress
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETAILED TIMELINE STAGE BREAKDOWN */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Journey Stage Activity Logs
            </h3>

            <div className="space-y-3">
              {patient.timeline.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border text-xs transition-all flex items-start justify-between gap-4 ${
                    item.active
                      ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
                      : item.completed
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                      item.completed ? 'bg-emerald-600 text-white' : item.active ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {idx + 1}
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.active && <Badge variant="warning">Current Active Stage</Badge>}
                        {item.completed && <Badge variant="success">Completed</Badge>}
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] font-semibold text-slate-500">
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HOSPITAL DIRECTORY & MAP */}
      {dashboardTab === 'NAVIGATION' && (
        <div className="space-y-6">
          {/* Top Search Controls */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" /> Hospital Directory & Counter Search
                </h2>
                <p className="text-xs text-slate-500">Find Doctors, Departments, Wards, Laboratories, Pharmacy, Billing, and Rest areas.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search doctor, room, laboratory..."
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
              {['ALL', 'DOCTOR', 'DEPARTMENT', 'WARD', 'LABORATORY', 'PHARMACY', 'BILLING', 'EMERGENCY', 'WAITING'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedNavCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedNavCategory === cat
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Search Results Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Locations Directory ({filteredNavLocations.length})
              </h3>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredNavLocations.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedLocationDetail(item)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{item.name}</span>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <div className="text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">Floor</span>
                      <span className="font-bold text-slate-800">{item.floor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Hospital Visual Map */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" /> Hospital Building Layout
              </h3>

              {/* Visual Floor Grid Mockup */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="text-[11px] text-amber-400 font-bold border-b border-slate-800 pb-2 flex justify-between">
                  <span>MAIN HOSPITAL WINGS</span>
                  <span>BLOCK A, B, C</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400">
                    <span className="text-amber-400 font-bold block">BLOCK A</span>
                    <span className="text-slate-300">OPD & Consultation</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400">
                    <span className="text-teal-400 font-bold block">BLOCK B</span>
                    <span className="text-slate-300">Pathology & Radiology</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-amber-400">
                    <span className="text-indigo-400 font-bold block">BLOCK C</span>
                    <span className="text-slate-300">Pharmacy & Cashier</span>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-950 border border-rose-800 hover:border-rose-500">
                    <span className="text-rose-400 font-bold block">EMERGENCY</span>
                    <span className="text-rose-200">Red Zone Triage</span>
                  </div>
                </div>
              </div>

              {selectedLocationDetail ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 text-sm">{selectedLocationDetail.name}</div>
                  <p className="text-slate-700"><strong>Location:</strong> {selectedLocationDetail.location}</p>
                  <p className="text-slate-700"><strong>Walking Route:</strong> Enter Main Entrance &rarr; Take Elevator bank to {selectedLocationDetail.floor} &rarr; Follow room indicators.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Click any location on the left directory to preview route guidance.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REAL-TIME NOTIFICATIONS STREAM */}
      {dashboardTab === 'NOTIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-600" /> Automated Patient Updates Feed
              </h2>
              <p className="text-xs text-slate-500">Subscribed notifications for Visit Code {patient.visitCode}</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newAlert = {
                  id: String(Date.now()),
                  title: 'Patient is waiting for billing clearance.',
                  body: 'Consultation complete. Proceed to Cashier Counter 1 for invoice finalization.',
                  time: 'Just Now',
                  type: 'INFO',
                  unread: true
                };
                setNotifications([newAlert, ...notifications]);
              }}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Simulate Status Push</span>
            </Button>
          </div>

          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-all text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{n.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{n.time}</span>
                </div>
                <p className="text-slate-600 text-xs pl-6">{n.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ATTENDER AMENITIES & REST AREAS */}
      {dashboardTab === 'AMENITIES' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">24/7 Cafeteria & Dining Lounge</h3>
            <p className="text-xs text-slate-500">Located on Floor 1, Block B. Fresh meals, beverages, tea/coffee, and comfortable seating.</p>
            <Badge variant="success">Open 24 Hours</Badge>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Free Guest Wi-Fi & Charging</h3>
            <p className="text-xs text-slate-500">High-speed public Wi-Fi Network: <strong>SmartHospital_Guest</strong>. USB phone chargers at all seating rows.</p>
            <Badge variant="teal">Free Access</Badge>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Wheelchair Assistance Desk</h3>
            <p className="text-xs text-slate-500">Located directly at the Main Entrance Lobby. Attenders can request complimentary wheelchair escorts.</p>
            <Badge variant="outline">Free Service</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
