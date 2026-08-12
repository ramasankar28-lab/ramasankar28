import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  QueueToken,
  Appointment,
  PatientVital,
  MedicalRecordsData,
  PrescriptionItem,
  LabReportItem
} from '../../types';
import { hospitalService } from '../../services/hospitalService';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  FileText,
  Building2,
  HeartPulse,
  UserCheck,
  Pill,
  FlaskConical,
  Send,
  Calendar,
  TrendingUp,
  Activity,
  Plus,
  Search,
  Filter,
  MessageSquare,
  ShieldAlert,
  Thermometer,
  Eye,
  RefreshCw,
  BarChart3,
  User,
  Phone,
  Check,
  X,
  PieChart as PieIcon
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

export function DoctorDashboard() {
  const { user } = useAuth();
  
  // State variables
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<PatientVital[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordsData | null>(null);
  const [staffMessages, setStaffMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Selections
  const [activeConsultation, setActiveConsultation] = useState<QueueToken | null>(null);
  const [selectedPatientMRN, setSelectedPatientMRN] = useState<string>('MRN-2026-8812');
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'QUEUE' | 'PATIENT_PROFILE' | 'COMMUNICATION' | 'WORKLOAD'>('CONSOLE');

  // Queue Filters
  const [queueSearch, setQueueSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Consultation Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  
  // Prescription Builder State
  const [prescMedicines, setPrescMedicines] = useState<Array<{ name: string; dosage: string; duration: string; instructions: string }>>([
    { name: 'Amoxicillin + Clavulanic Acid', dosage: '625 mg', duration: '5 Days', instructions: '1-0-1 After Food' }
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedDuration, setNewMedDuration] = useState('');
  const [newMedInstructions, setNewMedInstructions] = useState('');

  // Lab Request State
  const [selectedLabTest, setSelectedLabTest] = useState('Complete Blood Count (CBC)');
  const [labUrgency, setLabUrgency] = useState('NORMAL');
  const [labNotes, setLabNotes] = useState('');

  // Follow-up Scheduler State
  const [followUpDate, setFollowUpDate] = useState('2026-08-19');
  const [followUpSlot, setFollowUpSlot] = useState('10:00 AM');
  const [followUpPurpose, setFollowUpPurpose] = useState('Routine Progress Assessment');

  // Communication Form State
  const [msgRecipientRole, setMsgRecipientRole] = useState<'NURSE' | 'PHARMACY' | 'ADMIN'>('NURSE');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgText, setMsgText] = useState('');
  const [msgPriority, setMsgPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  // Status Alerts
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const doctorId = 'doc-1';

  // Load Dashboard Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allTokens, allAppts, allVitals, records, msgs] = await Promise.all([
        hospitalService.getTokens(),
        hospitalService.getAppointments(),
        hospitalService.getVitals(),
        hospitalService.getMedicalRecords(selectedPatientMRN),
        hospitalService.getStaffMessages()
      ]);

      const docTokens = allTokens.filter((t) => t.doctorId === doctorId || t.departmentName?.includes('General'));
      setTokens(docTokens);
      setAppointments(allAppts.filter(a => a.doctorId === doctorId || a.doctorName.includes('Vance')));
      setVitals(allVitals);
      setMedicalRecords(records);
      setStaffMessages(msgs);

      // Set default active patient
      const inConsult = docTokens.find((t) => t.status === 'IN_CONSULTATION');
      if (inConsult) {
        setActiveConsultation(inConsult);
        setSelectedPatientMRN(inConsult.mrn);
      } else {
        const nextWaiting = docTokens.find((t) => t.status === 'WAITING');
        if (nextWaiting) {
          setActiveConsultation(nextWaiting);
          setSelectedPatientMRN(nextWaiting.mrn);
        }
      }
    } catch (err) {
      console.error('Error fetching doctor dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch Patient Medical Records when patient selection changes
  useEffect(() => {
    if (selectedPatientMRN) {
      hospitalService.getMedicalRecords(selectedPatientMRN).then(res => setMedicalRecords(res)).catch(() => {});
    }
  }, [selectedPatientMRN]);

  // Flash message notification
  const triggerSuccess = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  // Status Handler
  const handleStatusChange = async (tokenId: string, status: 'IN_CONSULTATION' | 'COMPLETED' | 'SKIPPED') => {
    try {
      await hospitalService.updateTokenStatus(tokenId, status, user?.roomNumber || 'Room 102');
      triggerSuccess(`Token updated to ${status}`);
      fetchData();
    } catch {
      // Ignore
    }
  };

  // Prescription Handlers
  const handleAddMedicine = () => {
    if (!newMedName) return;
    setPrescMedicines([...prescMedicines, {
      name: newMedName,
      dosage: newMedDosage || '500 mg',
      duration: newMedDuration || '5 Days',
      instructions: newMedInstructions || '1-0-1 After Food'
    }]);
    setNewMedName('');
    setNewMedDosage('');
    setNewMedDuration('');
    setNewMedInstructions('');
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescMedicines(prescMedicines.filter((_, i) => i !== index));
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation) return;
    try {
      await hospitalService.createPrescription({
        mrn: activeConsultation.mrn,
        patientName: activeConsultation.patientName,
        doctorName: user?.name || 'Dr. Aris Vance, MD',
        departmentName: user?.departmentName || 'General Medicine & OPD',
        diagnosis: diagnosis || 'General Clinical Evaluation',
        medicines: prescMedicines
      });
      triggerSuccess(`e-Prescription created and transmitted to Pharmacy!`);
      const updatedRecords = await hospitalService.getMedicalRecords(activeConsultation.mrn);
      setMedicalRecords(updatedRecords);
    } catch (err) {
      alert('Failed to send prescription.');
    }
  };

  // Lab Request Handler
  const handleRequestLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation) return;
    try {
      await hospitalService.createLabOrder({
        mrn: activeConsultation.mrn,
        patientName: activeConsultation.patientName,
        testName: selectedLabTest,
        category: 'Diagnostics & Pathology',
        orderedBy: user?.name || 'Dr. Aris Vance, MD',
        metricsSummary: labNotes || 'Stat clinical investigation ordered during OPD consultation.'
      });
      triggerSuccess(`Diagnostic order "${selectedLabTest}" submitted to Pathology Lab!`);
      const updatedRecords = await hospitalService.getMedicalRecords(activeConsultation.mrn);
      setMedicalRecords(updatedRecords);
    } catch (err) {
      alert('Failed to order lab test.');
    }
  };

  // Follow-up Scheduler Handler
  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultation) return;
    try {
      await hospitalService.bookAppointment({
        patientName: activeConsultation.patientName,
        patientPhone: activeConsultation.patientPhone,
        doctorId: doctorId,
        date: followUpDate,
        timeSlot: followUpSlot,
        type: 'FOLLOW_UP',
        symptoms: followUpPurpose
      });
      triggerSuccess(`Follow-up appointment scheduled for ${followUpDate} at ${followUpSlot}!`);
      const appts = await hospitalService.getAppointments();
      setAppointments(appts.filter(a => a.doctorId === doctorId || a.doctorName.includes('Vance')));
    } catch (err) {
      alert('Failed to schedule follow-up.');
    }
  };

  // Communication Send Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    try {
      await hospitalService.sendStaffMessage({
        senderRole: 'DOCTOR',
        senderName: user?.name || 'Dr. Aris Vance, MD',
        recipientRole: msgRecipientRole,
        subject: msgSubject || `Clinical Note for ${msgRecipientRole}`,
        message: msgText,
        priority: msgPriority
      });
      triggerSuccess(`Direct message transmitted to ${msgRecipientRole}!`);
      setMsgSubject('');
      setMsgText('');
      const updatedMsgs = await hospitalService.getStaffMessages();
      setStaffMessages(updatedMsgs);
    } catch (err) {
      alert('Failed to send message.');
    }
  };

  // Metrics Calculations
  const waitingQueue = tokens.filter((t) => t.status === 'WAITING');
  const completedToday = tokens.filter((t) => t.status === 'COMPLETED');
  const emergencyCases = tokens.filter((t) => t.priority === 'EMERGENCY');
  const avgConsultTime = 8; // mins
  const remainingAppts = appointments.filter(a => a.status === 'CONFIRMED');

  // Filter Queue Tokens
  const filteredQueue = tokens.filter(t => {
    const matchesSearch = t.patientName.toLowerCase().includes(queueSearch.toLowerCase()) ||
                          t.tokenNumber.toLowerCase().includes(queueSearch.toLowerCase()) ||
                          t.mrn.toLowerCase().includes(queueSearch.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  // Current Patient Vitals
  const currentVital = vitals.find(v => v.mrn === activeConsultation?.mrn || v.patientName === activeConsultation?.patientName) || {
    heartRate: 74,
    bpSystolic: 122,
    bpDiastolic: 80,
    spO2: 98,
    temperature: 36.8,
    alertStatus: 'STABLE' as const
  };

  // Chart Data for Workload
  const workloadHourlyData = [
    { hour: '08:00 AM', completed: 2, waiting: 1 },
    { hour: '09:00 AM', completed: 4, waiting: 3 },
    { hour: '10:00 AM', completed: 5, waiting: 4 },
    { hour: '11:00 AM', completed: 3, waiting: 2 },
    { hour: '12:00 PM', completed: 2, waiting: 1 },
    { hour: '01:00 PM', completed: 1, waiting: 0 },
  ];

  const priorityPieData = [
    { name: 'Emergency', value: emergencyCases.length || 1, color: '#ef4444' },
    { name: 'Senior Citizen / High', value: tokens.filter(t => t.priority === 'SENIOR_CITIZEN').length || 2, color: '#f59e0b' },
    { name: 'Pregnant / Disabled', value: tokens.filter(t => t.priority === 'PREGNANT_OR_DISABLED').length || 1, color: '#8b5cf6' },
    { name: 'Normal OPD', value: tokens.filter(t => t.priority === 'NORMAL').length || 5, color: '#3b82f6' },
  ];

  const durationTrendData = [
    { patient: 'P-1', mins: 7 },
    { patient: 'P-2', mins: 12 },
    { patient: 'P-3', mins: 8 },
    { patient: 'P-4', mins: 6 },
    { patient: 'P-5', mins: 10 },
    { patient: 'P-6', mins: 9 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Banner */}
      {actionSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/90 text-white px-5 py-3 rounded-xl shadow-2xl border border-emerald-500/40 flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-blue-400" />
            <span>Smart Hospital Clinical OPD Desk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {user?.name || 'Dr. Aris Vance, MD'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200/80 mt-1 flex flex-wrap items-center gap-2">
            <span>{user?.departmentName || 'General Medicine & OPD'}</span>
            <span>•</span>
            <span>Room: <strong className="text-amber-300 font-bold">{user?.roomNumber || 'Room 102'}</strong></span>
            <span>•</span>
            <span className="text-emerald-300 font-medium">Shift: 08:30 AM - 02:30 PM (Active)</span>
          </p>
        </div>

        {/* Quick Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => setActiveTab('CONSOLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'CONSOLE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Consultation Console</span>
          </button>

          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'QUEUE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Patient Queue ({waitingQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PATIENT_PROFILE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PATIENT_PROFILE'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Medical Records</span>
          </button>

          <button
            onClick={() => setActiveTab('COMMUNICATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'COMMUNICATION'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Staff Messages</span>
          </button>

          <button
            onClick={() => setActiveTab('WORKLOAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'WORKLOAD'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Workload & Charts</span>
          </button>
        </div>
      </div>

      {/* Overview Dashboard Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Today's Appointments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Appointments</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{appointments.length || 12}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">{remainingAppts.length} Remaining</div>
          </div>
        </div>

        {/* Current Patient */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Patient</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-lg font-black text-amber-600 truncate font-mono">
              #{activeConsultation?.tokenNumber || 'A-101'}
            </div>
            <div className="text-[11px] font-bold text-slate-800 truncate">
              {activeConsultation?.patientName || 'David Miller'}
            </div>
          </div>
        </div>

        {/* Waiting Patients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Queue Waiting</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">{waitingQueue.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Est. ~{waitingQueue.length * 8}m total</div>
          </div>
        </div>

        {/* Completed Consultations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{completedToday.length || 14}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Today's Total</div>
          </div>
        </div>

        {/* Emergency Cases */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Emergencies</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{emergencyCases.length}</div>
            <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
              Priority Red
            </div>
          </div>
        </div>

        {/* Average Consultation Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg. Time</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{avgConsultTime} <span className="text-xs text-slate-500 font-normal">mins</span></div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Target: 10 mins</div>
          </div>
        </div>

        {/* Current Workload */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Workload</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-lg font-black text-teal-600">68%</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">28 / 35 Max Patients</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA ACCORDING TO ACTIVE TAB */}

      {/* TAB 1: CONSULTATION CONSOLE */}
      {activeTab === 'CONSOLE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Patient Caller & Consultation Panel */}
          <div className="lg:col-span-8 space-y-6">
            {/* Active Caller Control Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Active Consultation Caller</h2>
                </div>
                {activeConsultation && (
                  <Badge variant={
                    activeConsultation.status === 'IN_CONSULTATION' ? 'success' :
                    activeConsultation.status === 'WAITING' ? 'warning' : 'outline'
                  }>
                    {activeConsultation.status}
                  </Badge>
                )}
              </div>

              {activeConsultation ? (
                <div className="space-y-6">
                  {/* Token Caller Display */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-teal-400 uppercase font-mono block tracking-wider">CALLING TOKEN</span>
                      <div className="text-4xl font-extrabold text-amber-400 font-mono tracking-tight mt-0.5">
                        #{activeConsultation.tokenNumber}
                      </div>
                      <div className="text-base font-bold text-white mt-1">{activeConsultation.patientName}</div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-3 mt-1">
                        <span>MRN: {activeConsultation.mrn}</span>
                        <span>•</span>
                        <span>Age: 42 yrs (Male)</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                      {activeConsultation.status === 'WAITING' ? (
                        <Button
                          variant="teal"
                          onClick={() => handleStatusChange(activeConsultation.id, 'IN_CONSULTATION')}
                          className="w-full flex items-center justify-center gap-2 text-xs py-2.5"
                        >
                          <span>Call Patient Inside Room</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="teal"
                          onClick={() => handleStatusChange(activeConsultation.id, 'COMPLETED')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 text-xs py-2.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete Consultation & Call Next</span>
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => handleStatusChange(activeConsultation.id, 'SKIPPED')}
                        className="w-full text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                      >
                        Skip Token
                      </Button>
                    </div>
                  </div>

                  {/* Patient Vitals Quick View Strip */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><HeartPulse className="w-4 h-4 text-rose-600" /> Patient Vitals</span>
                      <span className="text-[10px] text-slate-500 font-mono">Last updated: 10m ago</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">Heart Rate</span>
                        <span className="text-sm font-extrabold text-slate-900">{currentVital.heartRate} <span className="text-[10px] text-slate-500 font-normal">bpm</span></span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">Blood Pressure</span>
                        <span className="text-sm font-extrabold text-slate-900">{currentVital.bpSystolic}/{currentVital.bpDiastolic} <span className="text-[10px] text-slate-500 font-normal">mmHg</span></span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">SpO2</span>
                        <span className="text-sm font-extrabold text-emerald-600">{currentVital.spO2}%</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 font-mono block">Temperature</span>
                        <span className="text-sm font-extrabold text-slate-900">{currentVital.temperature}°C</span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Actions Form Tabs */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-6">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-blue-600" /> Clinical Recording & Orders</span>
                      <button 
                        onClick={() => {
                          setActiveTab('PATIENT_PROFILE');
                          setSelectedPatientMRN(activeConsultation.mrn);
                        }}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" /> Full Medical History
                      </button>
                    </h3>

                    {/* 1. Record Diagnosis & Clinical SOAP Notes */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Primary Clinical Diagnosis
                        </label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="e.g. Acute Upper Respiratory Tract Infection with Mild Hypertension"
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Clinical Progress SOAP Notes
                        </label>
                        <textarea
                          rows={3}
                          value={clinicalNotes}
                          onChange={(e) => setClinicalNotes(e.target.value)}
                          placeholder="Patient reports 3-day history of low grade fever, malaise, sore throat. Lungs clear to auscultation..."
                          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
                    </div>

                    {/* 2. Create Prescription Form */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Pill className="w-4 h-4 text-emerald-600" /> Create e-Prescription
                        </label>
                        <span className="text-[10px] text-slate-500">Directly syncs to Hospital Pharmacy</span>
                      </div>

                      {/* Active Medicine List */}
                      <div className="space-y-2">
                        {prescMedicines.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                            <div>
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[11px] text-slate-600">{m.dosage} • {m.duration} • {m.instructions}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedicine(idx)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add New Medicine Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                        <input
                          type="text"
                          placeholder="Medicine Name (e.g. Paracetamol)"
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Dosage (e.g. 500 mg)"
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                        />
                        <input
                          type="text"
                          placeholder="Duration (e.g. 5 Days)"
                          value={newMedDuration}
                          onChange={(e) => setNewMedDuration(e.target.value)}
                          className="px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                        />
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="Instructions (e.g. 1-0-1)"
                            value={newMedInstructions}
                            onChange={(e) => setNewMedInstructions(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                          />
                          <Button
                            type="button"
                            onClick={handleAddMedicine}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleCreatePrescription}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 flex items-center justify-center gap-2"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Sign & Send e-Prescription to Pharmacy</span>
                      </Button>
                    </div>

                    {/* 3. Request Laboratory Tests Form */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <FlaskConical className="w-4 h-4 text-indigo-600" /> Order Diagnostic Lab Tests
                        </label>
                        <span className="text-[10px] text-slate-500">Transmits to Pathology Lab</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Diagnostic Test</label>
                          <select
                            value={selectedLabTest}
                            onChange={(e) => setSelectedLabTest(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option>Complete Blood Count (CBC)</option>
                            <option>Lipid Profile Panel</option>
                            <option>HbA1c & Fasting Blood Glucose</option>
                            <option>Liver Function Test (LFT)</option>
                            <option>Kidney Function Test (KFT)</option>
                            <option>Chest X-Ray PA View</option>
                            <option>ECG 12-Lead Examination</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Urgency Level</label>
                          <select
                            value={labUrgency}
                            onChange={(e) => setLabUrgency(e.target.value)}
                            className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="NORMAL">Normal Routine</option>
                            <option value="URGENT">Urgent (Within 2 Hours)</option>
                            <option value="STAT">STAT / Immediate Emergency</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Lab Order Special Clinical Indications / Notes..."
                          value={labNotes}
                          onChange={(e) => setLabNotes(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleRequestLab}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 flex items-center justify-center gap-2"
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>Submit Lab Test Order to Pathology</span>
                      </Button>
                    </div>

                    {/* 4. Schedule Follow-up Visit */}
                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-600" /> Schedule Follow-up Appointment
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Follow-up Date</label>
                          <input
                            type="date"
                            value={followUpDate}
                            onChange={(e) => setFollowUpDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Time Slot</label>
                          <select
                            value={followUpSlot}
                            onChange={(e) => setFollowUpSlot(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          >
                            <option>09:30 AM</option>
                            <option>10:00 AM</option>
                            <option>11:00 AM</option>
                            <option>02:00 PM</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Purpose</label>
                          <input
                            type="text"
                            value={followUpPurpose}
                            onChange={(e) => setFollowUpPurpose(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={handleScheduleFollowUp}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Schedule Follow-Up Visit</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">All OPD tokens completed for this session!</p>
                  <p className="text-xs text-slate-500 mt-1">No additional waiting patients in queue.</p>
                </div>
              )}
            </div>
          </div>

          {/* OPD Queue Sidebar */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" /> OPD Room Queue ({waitingQueue.length})
                </h3>
                <button
                  onClick={fetchData}
                  className="text-slate-400 hover:text-slate-600 p-1"
                  title="Refresh Queue"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
                {waitingQueue.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No patients currently waiting.</p>
                ) : (
                  waitingQueue.map((t, idx) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setActiveConsultation(t);
                        setSelectedPatientMRN(t.mrn);
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                        activeConsultation?.id === t.id
                          ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/20'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">#{t.tokenNumber}</div>
                          <div className="text-[11px] text-slate-600 font-medium">{t.patientName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">MRN: {t.mrn}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-emerald-600 block">~{t.estimatedWaitMinutes}m</span>
                        <Badge variant={
                          t.priority === 'EMERGENCY' ? 'danger' :
                          t.priority === 'SENIOR_CITIZEN' ? 'warning' : 'outline'
                        }>
                          {t.priority}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab('QUEUE')}
                className="w-full text-xs flex items-center justify-center gap-1.5 py-2"
              >
                <span>View Full Interactive Queue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT QUEUE TABLE */}
      {activeTab === 'QUEUE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" /> Patient OPD Queue Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time token sequence, priority classifications, and patient waiting times.</p>
            </div>

            {/* Queue Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search token, name, MRN..."
                  value={queueSearch}
                  onChange={(e) => setQueueSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="ALL">All Priorities</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="SENIOR_CITIZEN">Senior Citizen / High</option>
                <option value="PREGNANT_OR_DISABLED">Pregnant / Disabled</option>
                <option value="NORMAL">Normal</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="IN_CONSULTATION">In Consultation</option>
                <option value="COMPLETED">Completed</option>
                <option value="SKIPPED">Skipped</option>
              </select>
            </div>
          </div>

          {/* Queue Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Token #</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Age / Gender</th>
                  <th className="py-3 px-4">Appt / Issue Time</th>
                  <th className="py-3 px-4">Priority Level</th>
                  <th className="py-3 px-4">Waiting Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No queue tokens match current filters.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-extrabold text-blue-700 text-sm">
                        #{t.tokenNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">MRN: {t.mrn}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        42 yrs / Male
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {t.issueTime}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                          t.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          t.priority === 'SENIOR_CITIZEN' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          t.priority === 'PREGNANT_OR_DISABLED' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {t.priority === 'SENIOR_CITIZEN' ? 'HIGH (SENIOR)' :
                           t.priority === 'PREGNANT_OR_DISABLED' ? 'MODERATE' : t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                        {t.status === 'COMPLETED' ? '0m (Done)' : `~${t.estimatedWaitMinutes} mins`}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          t.status === 'IN_CONSULTATION' ? 'success' :
                          t.status === 'WAITING' ? 'warning' :
                          t.status === 'COMPLETED' ? 'info' : 'outline'
                        }>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setActiveConsultation(t);
                              setSelectedPatientMRN(t.mrn);
                              setActiveTab('CONSOLE');
                            }}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-[11px]"
                          >
                            Select & Call
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPatientMRN(t.mrn);
                              setActiveTab('PATIENT_PROFILE');
                            }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-lg text-[11px]"
                          >
                            Medical History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PATIENT MEDICAL DETAILS PROFILE */}
      {activeTab === 'PATIENT_PROFILE' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Patient Header Bar */}
          <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold mb-1">
                PATIENT MEDICAL RECORD PORTAL
              </div>
              <h2 className="text-xl font-extrabold text-white">
                David Miller <span className="text-sm font-normal text-slate-400 font-mono">(MRN: {selectedPatientMRN})</span>
              </h2>
              <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-3">
                <span>Age: 42 yrs</span>
                <span>•</span>
                <span>Gender: Male</span>
                <span>•</span>
                <span>Blood Group: O+ Positive</span>
                <span>•</span>
                <span>Phone: +1 (555) 234-5678</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('CONSOLE')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Return to Consultation Console</span>
            </button>
          </div>

          {/* Quick Metrics Bar: Vitals & Allergies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Allergies & Current Medications Card */}
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Documented Patient Allergies
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-rose-200 text-rose-900 rounded-lg text-xs font-bold border border-rose-300">
                  Penicillin (Severe Rash)
                </span>
                <span className="px-2.5 py-1 bg-amber-200 text-amber-900 rounded-lg text-xs font-bold border border-amber-300">
                  NSAIDs (Mild Gastric Irritation)
                </span>
                <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium">
                  Dust & Pollen
                </span>
              </div>
            </div>

            {/* Vital Signs Overview Card */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-blue-600" /> Current Vitals (Station #1)
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <div className="text-[10px] text-slate-500">Heart Rate</div>
                  <div className="font-extrabold text-slate-900">{currentVital.heartRate} bpm</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <div className="text-[10px] text-slate-500">Blood Pressure</div>
                  <div className="font-extrabold text-slate-900">{currentVital.bpSystolic}/{currentVital.bpDiastolic}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <div className="text-[10px] text-slate-500">SpO2</div>
                  <div className="font-extrabold text-emerald-600">{currentVital.spO2}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100">
                  <div className="text-[10px] text-slate-500">Temp</div>
                  <div className="font-extrabold text-slate-900">{currentVital.temperature}°C</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed History Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medical History & Diagnosed Conditions */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <FileText className="w-4 h-4 text-blue-600" /> Diagnosed Medical History
              </h3>

              <div className="space-y-3">
                {medicalRecords?.history.map((item) => (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">{item.condition}</span>
                      <Badge variant={item.status === 'ACTIVE' ? 'warning' : 'success'}>
                        {item.status}
                      </Badge>
                    </div>
                    <div className="text-slate-500">Diagnosed: {item.diagnosedDate} • Dr. {item.treatingDoctor}</div>
                    <p className="text-slate-600 mt-1 italic">"{item.notes}"</p>
                  </div>
                )) || (
                  <p className="text-xs text-slate-400">Loading medical history...</p>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
                <Pill className="w-4 h-4 text-emerald-600" /> Active & Past Prescriptions
              </h3>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {medicalRecords?.prescriptions.map((p) => (
                  <div key={p.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700 font-mono">#{p.prescriptionNumber}</span>
                      <span className="text-[10px] text-slate-500">{p.date}</span>
                    </div>
                    <div className="font-semibold text-slate-800">Diagnosis: {p.diagnosis}</div>
                    <div className="space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {p.medicines.map((m, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span className="font-medium text-slate-900">{m.name} ({m.dosage})</span>
                          <span className="text-slate-500 font-mono">{m.instructions}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )) || (
                  <p className="text-xs text-slate-400">No active prescriptions found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Lab Reports & Diagnostic Metrics Breakdown */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <FlaskConical className="w-4 h-4 text-indigo-600" /> Diagnostic Pathology Lab Reports
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicalRecords?.labReports.map((lab) => (
                <div key={lab.id} className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{lab.testName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Order Date: {lab.orderDate}</div>
                    </div>
                    <Badge variant={lab.status === 'COMPLETED' ? 'success' : 'warning'}>
                      {lab.status}
                    </Badge>
                  </div>

                  <p className="text-slate-600 bg-slate-50 p-2 rounded text-[11px] border border-slate-100">
                    {lab.resultsSummary}
                  </p>

                  <div className="space-y-1">
                    {lab.metrics.map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-100 text-[11px]">
                        <span className="text-slate-600 font-medium">{m.parameter}</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 mr-2">{m.result}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({m.normalRange})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INTER-STAFF COMMUNICATION HUB */}
      {activeTab === 'COMMUNICATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dispatch Message Creator */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <MessageSquare className="w-5 h-5 text-blue-600" /> Hospital Inter-Staff Communication
            </h2>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Department / Staff
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMsgRecipientRole('NURSE')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      msgRecipientRole === 'NURSE'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Nurses Station
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgRecipientRole('PHARMACY')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      msgRecipientRole === 'PHARMACY'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pharmacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setMsgRecipientRole('ADMIN')}
                    className={`py-2 rounded-xl font-bold transition-all ${
                      msgRecipientRole === 'ADMIN'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Admin / Reception
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Priority
                </label>
                <select
                  value={msgPriority}
                  onChange={(e: any) => setMsgPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="NORMAL">Normal Standard Note</option>
                  <option value="HIGH">High Priority Instruction</option>
                  <option value="URGENT">URGENT STAT Emergency Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stat Vitals Check for Room 102"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Detailed Instruction Note
                </label>
                <textarea
                  rows={4}
                  placeholder="Type instruction for assigned nurse or pharmacist..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                ></textarea>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Transmit Message to {msgRecipientRole}</span>
              </Button>
            </form>
          </div>

          {/* Active Message Activity Feed */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Message Activity Log</span>
              <span className="text-[10px] text-slate-400 font-mono">Live Inter-Department Sync</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {staffMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{msg.senderName}</span>
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                        {msg.recipientRole}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="font-bold text-slate-800 text-sm">{msg.subject}</div>
                  <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    {msg.message}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <Badge variant={msg.priority === 'URGENT' ? 'danger' : msg.priority === 'HIGH' ? 'warning' : 'outline'}>
                      {msg.priority}
                    </Badge>

                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Transmitted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKLOAD & DAILY CHARTS */}
      {activeTab === 'WORKLOAD' && (
        <div className="space-y-6">
          {/* Workload Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Completed Patients</span>
              <div className="text-3xl font-black text-emerald-600 mt-1">{completedToday.length || 14}</div>
              <span className="text-[10px] text-slate-400">Today's total consultations</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Patients Waiting</span>
              <div className="text-3xl font-black text-amber-500 mt-1">{waitingQueue.length}</div>
              <span className="text-[10px] text-slate-400">In OPD Room Line</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg. Consult Time</span>
              <div className="text-3xl font-black text-blue-600 mt-1">{avgConsultTime} <span className="text-sm font-normal">mins</span></div>
              <span className="text-[10px] text-slate-400">Target efficiency: 10 mins</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Remaining Appointments</span>
              <div className="text-3xl font-black text-indigo-600 mt-1">{remainingAppts.length}</div>
              <span className="text-[10px] text-slate-400">Scheduled for today</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Working Shift Hours</span>
              <div className="text-xl font-black text-slate-900 mt-1 font-mono">08:30 - 02:30</div>
              <span className="text-[10px] text-emerald-600 font-bold">1.5 hrs remaining</span>
            </div>
          </div>

          {/* Daily Workload Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Hourly Patient Flow Bar Chart */}
            <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" /> Hourly Patient Flow & Queue Breakdown
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">08:00 AM - 01:00 PM</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadHourlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="waiting" name="Waiting Line" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Priority Distribution Pie Chart */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <PieIcon className="w-4 h-4 text-indigo-600" /> Patient Priority Mix
              </h3>

              <div className="h-52 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1.5 text-xs">
                {priorityPieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-700 font-medium">{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-900">{item.value} patients</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Consultation Duration Trend Line Chart */}
            <div className="lg:col-span-12 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" /> Consultation Duration Trend (Minutes per Patient)
              </h3>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={durationTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="patient" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="m" />
                    <Tooltip />
                    <Line type="monotone" dataKey="mins" name="Consultation Mins" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
