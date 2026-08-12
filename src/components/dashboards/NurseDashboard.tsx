import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  PatientVital,
  NursingTask,
  MedicationTask,
  NursingNote
} from '../../types';
import { hospitalService } from '../../services/hospitalService';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  Clock,
  Search,
  Plus,
  Pill,
  FileText,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  Thermometer,
  Eye,
  RefreshCw,
  Send,
  Calendar,
  Check,
  X,
  Stethoscope,
  ChevronRight,
  ClipboardList,
  AlertCircle,
  BarChart3,
  Flame,
  Zap,
  CheckSquare
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export function NurseDashboard() {
  const { user } = useAuth();

  // State Variables
  const [vitals, setVitals] = useState<PatientVital[]>([]);
  const [tasks, setTasks] = useState<NursingTask[]>([]);
  const [medications, setMedications] = useState<MedicationTask[]>([]);
  const [notes, setNotes] = useState<NursingNote[]>([]);
  const [doctorMessages, setDoctorMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PATIENT_MONITORING' | 'TASKS' | 'MEDICATION' | 'COMMUNICATION' | 'DIGITAL_NOTES'>('OVERVIEW');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'URGENT' | 'COMPLETED'>('ALL');
  const [medFilter, setMedFilter] = useState<'ALL' | 'SCHEDULED' | 'OVERDUE' | 'ADMINISTERED'>('ALL');

  // Selected Patient for Charts / Detailed Actions
  const [selectedPatientMRN, setSelectedPatientMRN] = useState<string>('MRN-2026-1049');

  // Record / Update Vitals Modal State
  const [selectedVital, setSelectedVital] = useState<PatientVital | null>(null);
  const [editSpO2, setEditSpO2] = useState<number>(98);
  const [editHR, setEditHR] = useState<number>(72);
  const [editSystolic, setEditSystolic] = useState<number>(120);
  const [editDiastolic, setEditDiastolic] = useState<number>(80);
  const [editTemp, setEditTemp] = useState<number>(37.0);
  const [editRespRate, setEditRespRate] = useState<number>(18);
  const [editGlucose, setEditGlucose] = useState<number>(110);
  const [isSavingVitals, setIsSavingVitals] = useState(false);

  // Create Task Form State
  const [newTaskPatient, setNewTaskPatient] = useState('Arthur Pendelton (MRN-2026-1049)');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'VITAL_CHECK' | 'MEDICATION' | 'DRESSING' | 'LAB_SAMPLE' | 'IV_DRIP' | 'OTHER'>('VITAL_CHECK');
  const [newTaskUrgent, setNewTaskUrgent] = useState(false);
  const [newTaskDueTime, setNewTaskDueTime] = useState('12:00 PM');

  // Create Digital Note Form State
  const [notePatient, setNotePatient] = useState('Arthur Pendelton');
  const [noteMRN, setNoteMRN] = useState('MRN-2026-1049');
  const [noteBed, setNoteBed] = useState('ICU Bed 04');
  const [noteCategory, setNoteCategory] = useState<'SOAP_SUBJECTIVE' | 'CARE_PLAN' | 'OBSERVATION' | 'SHIFT_HANDOVER'>('SOAP_SUBJECTIVE');
  const [noteText, setNoteText] = useState('');

  // Doctor Communication Form State
  const [docRecipient, setDocRecipient] = useState('Dr. Aris Vance, MD');
  const [docSubject, setDocSubject] = useState('');
  const [docMessage, setDocMessage] = useState('');
  const [docPriority, setDocPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('HIGH');

  // Notification Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Dashboard Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vitalsData, tasksData, medsData, notesData, msgsData] = await Promise.all([
        hospitalService.getVitals(),
        hospitalService.getNursingTasks(),
        hospitalService.getMedicationTasks(),
        hospitalService.getNursingNotes(),
        hospitalService.getStaffMessages('NURSE')
      ]);

      setVitals(vitalsData);
      setTasks(tasksData);
      setMedications(medsData);
      setNotes(notesData);
      setDoctorMessages(msgsData);
    } catch (err) {
      console.error('Error fetching nurse dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Edit Vitals Modal
  const handleOpenEditVitals = (v: PatientVital) => {
    setSelectedVital(v);
    setEditSpO2(v.spO2);
    setEditHR(v.heartRate);
    setEditSystolic(v.bpSystolic);
    setEditDiastolic(v.bpDiastolic);
    setEditTemp(v.temperature || 37.0);
    setEditRespRate(v.respiratoryRate || 18);
    setEditGlucose(v.bloodGlucose || 110);
  };

  // Save Vitals
  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVital) return;

    setIsSavingVitals(true);
    try {
      let alertStatus: 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
      if (editSpO2 < 92 || editHR > 120 || editSystolic > 160 || editTemp > 38.5) {
        alertStatus = 'CRITICAL';
      } else if (editSpO2 < 95 || editHR > 100 || editSystolic > 140 || editTemp > 37.8) {
        alertStatus = 'WARNING';
      }

      await hospitalService.updateVitals(selectedVital.id, {
        spO2: editSpO2,
        heartRate: editHR,
        bpSystolic: editSystolic,
        bpDiastolic: editDiastolic,
        temperature: editTemp,
        respiratoryRate: editRespRate,
        bloodGlucose: editGlucose,
        alertStatus
      });

      triggerToast(`Vitals recorded for ${selectedVital.patientName}`);
      setSelectedVital(null);
      fetchData();
    } catch {
      alert('Failed to update vitals record.');
    } finally {
      setIsSavingVitals(false);
    }
  };

  // Create Nursing Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      await hospitalService.createNursingTask({
        patientName: newTaskPatient.split(' (')[0],
        mrn: newTaskPatient.includes('MRN') ? newTaskPatient.split('(')[1].replace(')', '') : 'MRN-2026-1049',
        bedNumber: 'Ward Bed',
        title: newTaskTitle,
        description: newTaskDesc,
        category: newTaskCategory,
        isUrgent: newTaskUrgent,
        dueTime: newTaskDueTime,
        assignedNurse: user?.name || 'Nurse Elena Rostova'
      });
      triggerToast(`New task "${newTaskTitle}" added to workflow.`);
      setNewTaskTitle('');
      setNewTaskDesc('');
      fetchData();
    } catch {
      alert('Failed to create task.');
    }
  };

  // Complete / Toggle Urgent Task
  const handleTaskStatusToggle = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await hospitalService.updateNursingTask(taskId, { status: nextStatus as any });
      triggerToast(`Task marked as ${nextStatus}`);
      fetchData();
    } catch {
      // Ignore
    }
  };

  const handleToggleUrgentTask = async (taskId: string, currentUrgent: boolean) => {
    try {
      await hospitalService.updateNursingTask(taskId, { isUrgent: !currentUrgent });
      triggerToast(`Task urgency updated.`);
      fetchData();
    } catch {
      // Ignore
    }
  };

  // Administer Medication
  const handleAdministerMedication = async (medId: string) => {
    try {
      await hospitalService.updateMedicationTask(medId, {
        status: 'ADMINISTERED',
        administeredAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        administeredBy: user?.name || 'Nurse Elena Rostova'
      });
      triggerToast(`Medication administered and logged to EHR.`);
      fetchData();
    } catch {
      alert('Failed to update medication status.');
    }
  };

  // Create Digital Nursing Note
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      await hospitalService.createNursingNote({
        patientName: notePatient,
        mrn: noteMRN,
        bedNumber: noteBed,
        nurseName: user?.name || 'Nurse Elena Rostova',
        category: noteCategory,
        note: noteText
      });
      triggerToast(`Digital nursing note logged to EHR.`);
      setNoteText('');
      fetchData();
    } catch {
      alert('Failed to log nursing note.');
    }
  };

  // Send Alert / Message to Doctor
  const handleSendDoctorAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docMessage.trim()) return;
    try {
      await hospitalService.sendStaffMessage({
        senderRole: 'NURSE',
        senderName: user?.name || 'Nurse Elena Rostova, RN',
        recipientRole: 'DOCTOR',
        subject: docSubject || 'Ward Telemetry Alert',
        message: docMessage,
        priority: docPriority
      });
      triggerToast(`Direct clinical alert sent to ${docRecipient}!`);
      setDocSubject('');
      setDocMessage('');
      fetchData();
    } catch {
      alert('Failed to transmit message.');
    }
  };

  // Derived KPI Metrics
  const assignedPatients = vitals;
  const criticalPatients = vitals.filter(v => v.alertStatus === 'CRITICAL' || v.spO2 < 92);
  const stablePatients = vitals.filter(v => v.alertStatus === 'STABLE');
  const monitoringPatients = vitals.filter(v => v.alertStatus === 'WARNING');

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'OVERDUE');
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');
  const urgentTasks = tasks.filter(t => t.isUrgent && t.status !== 'COMPLETED');

  const pendingMeds = medications.filter(m => m.status === 'SCHEDULED' || m.status === 'OVERDUE');
  const doctorAlertsCount = doctorMessages.length;
  const emergencyAlertsCount = criticalPatients.length + urgentTasks.length;

  // Filtered Task Lists
  const filteredTasks = tasks.filter(t => {
    if (taskFilter === 'PENDING') return t.status === 'PENDING';
    if (taskFilter === 'OVERDUE') return t.status === 'OVERDUE';
    if (taskFilter === 'URGENT') return t.isUrgent;
    if (taskFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  // Filtered Medication Schedule
  const filteredMeds = medications.filter(m => {
    if (medFilter === 'SCHEDULED') return m.status === 'SCHEDULED';
    if (medFilter === 'OVERDUE') return m.status === 'OVERDUE';
    if (medFilter === 'ADMINISTERED') return m.status === 'ADMINISTERED';
    return true;
  });

  // Trend Data for Selected Patient Charts
  const activeVitalPatient = vitals.find(v => v.mrn === selectedPatientMRN) || vitals[0];

  const vitalTrendsData = [
    { time: '06:00 AM', spO2: activeVitalPatient?.spO2 ? activeVitalPatient.spO2 - 2 : 93, heartRate: 72, bpSystolic: 120, glucose: 105 },
    { time: '08:00 AM', spO2: activeVitalPatient?.spO2 ? activeVitalPatient.spO2 - 1 : 94, heartRate: 78, bpSystolic: 126, glucose: 122 },
    { time: '10:00 AM', spO2: activeVitalPatient?.spO2 || 96, heartRate: activeVitalPatient?.heartRate || 80, bpSystolic: activeVitalPatient?.bpSystolic || 128, glucose: activeVitalPatient?.bloodGlucose || 115 },
    { time: '12:00 PM', spO2: activeVitalPatient?.spO2 ? Math.min(100, activeVitalPatient.spO2 + 1) : 97, heartRate: 76, bpSystolic: 122, glucose: 110 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-purple-500/40 flex items-center gap-3 backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Shift Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-2">
            <HeartPulse className="w-3.5 h-3.5 text-purple-400" />
            <span>Digital Nursing Workstation & Telemetry Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {user?.name || 'Nurse Elena Rostova, RN'}
          </h1>

          {/* Shift Details Badge Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-purple-200">
            <div className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Shift: <strong className="text-amber-300 font-bold">Morning Shift (07:00 AM - 03:00 PM)</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
              <BedDouble className="w-3.5 h-3.5 text-emerald-400" />
              <span>Assigned Ward: <strong className="text-white font-bold">{user?.departmentName || 'Ward 3B - Cardiac & Med-Surg'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Role: <strong className="text-blue-300">Registered Charge Nurse (RN)</strong></span>
            </div>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'OVERVIEW' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('PATIENT_MONITORING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PATIENT_MONITORING' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            <span>Vitals Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'TASKS' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Tasks ({pendingTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MEDICATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'MEDICATION' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>Medication ({pendingMeds.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('COMMUNICATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'COMMUNICATION' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Doctor Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('DIGITAL_NOTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'DIGITAL_NOTES' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>EHR Notes</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD SUMMARY KPI CARDS (8 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Assigned Patients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Assigned</span>
            <BedDouble className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{assignedPatients.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Beds Monitored</div>
          </div>
        </div>

        {/* Critical Patients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{criticalPatients.length}</div>
            <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded inline-block mt-0.5">
              High Priority
            </div>
          </div>
        </div>

        {/* Stable Patients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Stable</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{stablePatients.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Normal Vitals</div>
          </div>
        </div>

        {/* Monitoring Patients */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Observation</span>
            <Eye className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-500">{monitoringPatients.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Watchlist</div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending Tasks</span>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{pendingTasks.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">{overdueTasks.length} Overdue</div>
          </div>
        </div>

        {/* Medication Tasks */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Medications</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-teal-600">{pendingMeds.length}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Doses Due</div>
          </div>
        </div>

        {/* Doctor Alerts */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Doctor Alerts</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-indigo-600">{doctorAlertsCount}</div>
            <div className="text-[10px] font-medium text-slate-500 mt-0.5">Inter-Staff Msgs</div>
          </div>
        </div>

        {/* Emergency Alerts */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Emergency</span>
            <Zap className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-600">{emergencyAlertsCount}</div>
            <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded inline-block mt-0.5">
              Code STAT
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW & SHIFT SUMMARY */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Assigned Patients Ward List */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-purple-600" /> Assigned Ward Patients ({assignedPatients.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Shift Ward 3B Bed Allocations & Real-Time Vital Status</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('PATIENT_MONITORING')}
                className="text-xs flex items-center gap-1"
              >
                <span>Log Vitals</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignedPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatientMRN(p.mrn)}
                  className={`p-4 rounded-xl border text-xs cursor-pointer transition-all space-y-3 ${
                    selectedPatientMRN === p.mrn
                      ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/20'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{p.patientName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({p.age}y, {p.gender})</span>
                      </div>
                      <div className="text-[11px] font-bold text-purple-700 mt-0.5">
                        {p.bedNumber} • {p.ward}
                      </div>
                    </div>

                    <Badge variant={
                      p.alertStatus === 'CRITICAL' ? 'danger' :
                      p.alertStatus === 'WARNING' ? 'warning' : 'success'
                    }>
                      {p.alertStatus}
                    </Badge>
                  </div>

                  {/* Vitals Quick Pill Strip */}
                  <div className="grid grid-cols-4 gap-2 text-center bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">SpO2</span>
                      <span className={`font-black font-mono ${p.spO2 < 92 ? 'text-rose-600' : 'text-emerald-600'}`}>{p.spO2}%</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">HR</span>
                      <span className="font-black font-mono text-slate-800">{p.heartRate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">BP</span>
                      <span className="font-black font-mono text-slate-800">{p.bpSystolic}/{p.bpDiastolic}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block font-mono uppercase">Temp</span>
                      <span className="font-black font-mono text-slate-800">{p.temperature}°C</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>Updated: {p.lastUpdated}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditVitals(p);
                      }}
                      className="text-purple-600 font-bold hover:underline"
                    >
                      Update Vitals
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Sidebar: Urgent Tasks & Doctor Messages */}
          <div className="lg:col-span-4 space-y-6">
            {/* Immediate Action Tasks */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" /> Urgent Nursing Tasks ({urgentTasks.length})
                </h3>
                <button
                  onClick={() => setActiveTab('TASKS')}
                  className="text-xs text-purple-600 font-bold hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {urgentTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No urgent tasks pending.</p>
                ) : (
                  urgentTasks.map(t => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-900">{t.title}</span>
                        <span className="text-[10px] font-mono text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
                          Due: {t.dueTime}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-700">{t.patientName} ({t.bedNumber})</div>
                      <p className="text-[10px] text-slate-600">{t.description}</p>
                      <div className="pt-1 flex justify-end">
                        <Button
                          size="sm"
                          variant="teal"
                          onClick={() => handleTaskStatusToggle(t.id, t.status)}
                          className="text-[10px] py-1 px-2 h-auto"
                        >
                          Mark Completed
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Doctor Alert Notifications */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-600" /> Recent Doctor Messages
                </h3>
                <button
                  onClick={() => setActiveTab('COMMUNICATION')}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  Open Messaging
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {doctorMessages.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No recent doctor messages.</p>
                ) : (
                  doctorMessages.slice(0, 3).map(m => (
                    <div key={m.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{m.senderName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{m.timestamp}</span>
                      </div>
                      <div className="text-indigo-700 font-semibold">{m.subject}</div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">{m.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENT MONITORING & VITALS RECORDING */}
      {activeTab === 'PATIENT_MONITORING' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-purple-600" /> Bedside Vital Signs Telemetry
              </h2>
              <p className="text-xs text-slate-500">Record SpO2, Blood Pressure, Heart Rate, Respiratory Rate, and Blood Glucose.</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter bed or patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <Button
                variant="teal"
                onClick={() => handleOpenEditVitals(vitals[0])}
                className="text-xs whitespace-nowrap flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record New Vitals</span>
              </Button>
            </div>
          </div>

          {/* Patient Vitals Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Bed & Patient</th>
                    <th className="px-4 py-3">SpO2 (%)</th>
                    <th className="px-4 py-3">Heart Rate (BPM)</th>
                    <th className="px-4 py-3">Blood Pressure (mmHg)</th>
                    <th className="px-4 py-3">Temp (°C)</th>
                    <th className="px-4 py-3">Resp Rate (bpm)</th>
                    <th className="px-4 py-3">Glucose (mg/dL)</th>
                    <th className="px-4 py-3">Alert Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vitals.filter(v => v.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || v.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())).map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => setSelectedPatientMRN(v.mrn)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        selectedPatientMRN === v.mrn ? 'bg-purple-50/50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-purple-600" />
                          <span>{v.patientName}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">{v.bedNumber} • MRN: {v.mrn}</div>
                      </td>
                      <td className="px-4 py-3 font-bold font-mono">
                        <span className={v.spO2 < 92 ? 'text-rose-600 font-black' : 'text-emerald-700'}>{v.spO2}%</span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{v.heartRate} bpm</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{v.bpSystolic}/{v.bpDiastolic}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{v.temperature}°C</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{v.respiratoryRate || 18}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{v.bloodGlucose || 110} mg/dL</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          v.alertStatus === 'CRITICAL' ? 'danger' :
                          v.alertStatus === 'WARNING' ? 'warning' : 'success'
                        }>
                          {v.alertStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditVitals(v);
                          }}
                          className="text-xs"
                        >
                          Record Vitals
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vitals Trend Charts Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" /> Patient Vital Sign Trends
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Showing telemetry history for <strong className="text-slate-900">{activeVitalPatient?.patientName}</strong> ({activeVitalPatient?.bedNumber})</p>
              </div>

              <select
                value={selectedPatientMRN}
                onChange={(e) => setSelectedPatientMRN(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              >
                {vitals.map(v => (
                  <option key={v.id} value={v.mrn}>
                    {v.patientName} ({v.bedNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chart 1: SpO2 & Heart Rate Trend */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Oxygen Saturation (SpO2 %) & Heart Rate (BPM)</span>
                  <span className="text-emerald-600 font-mono">Normal &gt; 95%</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vitalTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis domain={[60, 110]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="spO2" stroke="#10b981" fill="#d1fae5" name="SpO2 (%)" />
                      <Area type="monotone" dataKey="heartRate" stroke="#6366f1" fill="#e0e7ff" name="Heart Rate (BPM)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Blood Pressure & Glucose Trend */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>BP Systolic (mmHg) & Blood Glucose (mg/dL)</span>
                  <span className="text-blue-600 font-mono">Target &lt; 140 / 140</span>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                      <YAxis domain={[80, 180]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bpSystolic" stroke="#3b82f6" strokeWidth={2} name="BP Systolic" />
                      <Line type="monotone" dataKey="glucose" stroke="#f59e0b" strokeWidth={2} name="Glucose (mg/dL)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TASKS MANAGEMENT */}
      {activeTab === 'TASKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Task List Panel */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-purple-600" /> Nursing Care Tasks Console
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage nursing orders, dressings, vital checks, and lab sample collections.</p>
              </div>

              {/* Task Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'PENDING', 'OVERDUE', 'URGENT', 'COMPLETED'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      taskFilter === f ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">No tasks match current filter!</p>
                </div>
              ) : (
                filteredTasks.map(t => (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border text-xs transition-all space-y-2 ${
                      t.status === 'COMPLETED'
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : t.status === 'OVERDUE'
                        ? 'bg-amber-50/70 border-amber-300'
                        : t.isUrgent
                        ? 'bg-rose-50/70 border-rose-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleTaskStatusToggle(t.id, t.status)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white hover:border-purple-600'
                          }`}
                        >
                          {t.status === 'COMPLETED' && <Check className="w-3.5 h-3.5" />}
                        </button>

                        <div>
                          <div className={`font-bold text-sm ${t.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {t.title}
                          </div>
                          <div className="text-[11px] font-semibold text-purple-700 mt-0.5">
                            Patient: {t.patientName} ({t.bedNumber}) • MRN: {t.mrn}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{t.description}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <Badge variant={
                          t.status === 'COMPLETED' ? 'success' :
                          t.status === 'OVERDUE' ? 'warning' :
                          t.isUrgent ? 'danger' : 'outline'
                        }>
                          {t.status === 'OVERDUE' ? 'OVERDUE' : t.isUrgent ? 'STAT URGENT' : t.status}
                        </Badge>
                        <div className="text-[10px] font-mono text-slate-500">Due: {t.dueTime}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500 font-mono">Assigned: {t.assignedNurse}</span>
                      <button
                        onClick={() => handleToggleUrgentTask(t.id, t.isUrgent)}
                        className={`font-bold hover:underline ${t.isUrgent ? 'text-amber-600' : 'text-slate-500'}`}
                      >
                        {t.isUrgent ? 'Remove Urgent Flag' : 'Mark Urgent STAT'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Create Task Form Panel */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-600" /> Create Nursing Task
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Ward Patient</label>
                <select
                  value={newTaskPatient}
                  onChange={(e) => setNewTaskPatient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {vitals.map(v => (
                    <option key={v.id} value={`${v.patientName} (${v.mrn})`}>
                      {v.patientName} ({v.bedNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Change IV Drip / Vital Check"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Category</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => setNewTaskCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="VITAL_CHECK">Vital Sign Checking</option>
                  <option value="MEDICATION">Medication Administration</option>
                  <option value="DRESSING">Wound Dressing / Sanitation</option>
                  <option value="LAB_SAMPLE">Pathology Lab Sample Draw</option>
                  <option value="IV_DRIP">IV Fluids / Drip Monitor</option>
                  <option value="OTHER">Other Patient Care</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Time</label>
                <input
                  type="text"
                  value={newTaskDueTime}
                  onChange={(e) => setNewTaskDueTime(e.target.value)}
                  placeholder="e.g. 11:45 AM"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Instructions / Description</label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Clinical instructions or doctor notes..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgentCheck"
                  checked={newTaskUrgent}
                  onChange={(e) => setNewTaskUrgent(e.target.checked)}
                  className="rounded border-slate-300 text-purple-600"
                />
                <label htmlFor="urgentCheck" className="text-xs font-bold text-rose-700 cursor-pointer">
                  Mark as STAT Urgent Task
                </label>
              </div>

              <Button type="submit" variant="teal" className="w-full text-xs font-bold py-2.5">
                Add Task to Nursing Workflow
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: MEDICATION ADMINISTRATION */}
      {activeTab === 'MEDICATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-600" /> Ward Medication Administration Record (eMAR)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Track scheduled drug doses, routes, times, and log nurse administration signatures.</p>
            </div>

            {/* Med Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['ALL', 'SCHEDULED', 'OVERDUE', 'ADMINISTERED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setMedFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    medFilter === f ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-bold">
                  <th className="py-3 px-4">Patient & Bed</th>
                  <th className="py-3 px-4">Medicine & Route</th>
                  <th className="py-3 px-4">Dosage</th>
                  <th className="py-3 px-4">Scheduled Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No medication schedules found for current filter.
                    </td>
                  </tr>
                ) : (
                  filteredMeds.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div>{m.patientName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{m.bedNumber} • MRN: {m.mrn}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-teal-800">{m.medicineName}</div>
                        <div className="text-[10px] text-slate-500">Route: {m.route}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.dose}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{m.scheduledTime}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          m.status === 'ADMINISTERED' ? 'success' :
                          m.status === 'OVERDUE' ? 'warning' : 'outline'
                        }>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {m.status === 'ADMINISTERED' ? (
                          <span className="text-[10px] text-emerald-600 font-bold font-mono">
                            Administered at {m.administeredAt}
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="teal"
                            onClick={() => handleAdministerMedication(m.id)}
                            className="text-xs py-1 px-3"
                          >
                            Mark Administered
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: DOCTOR COMMUNICATION & ALERTS */}
      {activeTab === 'COMMUNICATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Send Alert Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" /> Transmit Direct Alert / Message to Doctor
            </h2>

            <form onSubmit={handleSendDoctorAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Consulting Doctor</label>
                <select
                  value={docRecipient}
                  onChange={(e) => setDocRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Dr. Aris Vance, MD">Dr. Aris Vance, MD (General Medicine)</option>
                  <option value="Dr. Sarah Jenkins, MD">Dr. Sarah Jenkins, MD (Cardiology)</option>
                  <option value="Dr. Michael Chen, DCH">Dr. Michael Chen, DCH (Pediatrics)</option>
                  <option value="All On-Call Ward Doctors">All On-Call Ward Doctors</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Alert Level</label>
                <select
                  value={docPriority}
                  onChange={(e) => setDocPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="NORMAL">Normal Routine Communication</option>
                  <option value="HIGH">High Priority Clinical Query</option>
                  <option value="URGENT">URGENT STAT Emergency Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Stat SpO2 Drop in ICU Bed 04"
                  value={docSubject}
                  onChange={(e) => setDocSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Message / Patient Observation</label>
                <textarea
                  rows={4}
                  placeholder="Detailed telemetry observations, current vitals, or medication clarification request..."
                  value={docMessage}
                  onChange={(e) => setDocMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  required
                ></textarea>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                <span>Transmit Alert to Doctor's Console</span>
              </Button>
            </form>
          </div>

          {/* Inter-Staff Message Activity Log */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Ward Staff Communication Feed
            </h2>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {doctorMessages.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No message history.</p>
              ) : (
                doctorMessages.map(m => (
                  <div key={m.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.senderName} → {m.recipientRole}</span>
                      <Badge variant={
                        m.priority === 'URGENT' ? 'danger' :
                        m.priority === 'HIGH' ? 'warning' : 'outline'
                      }>
                        {m.priority}
                      </Badge>
                    </div>
                    <div className="font-semibold text-indigo-800">{m.subject}</div>
                    <p className="text-slate-600">{m.message}</p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1 flex items-center justify-between">
                      <span>{m.timestamp}</span>
                      <span className="text-emerald-600 font-bold">{m.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DIGITAL DOCUMENTATION & EHR NOTES */}
      {activeTab === 'DIGITAL_NOTES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Note Panel */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" /> Digital Nursing Documentation Entry
            </h2>
            <p className="text-xs text-slate-500">Replaces paper nursing logs with instant EHR synchronized digital records.</p>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={notePatient}
                  onChange={(e) => {
                    setNotePatient(e.target.value);
                    const found = vitals.find(v => v.patientName === e.target.value);
                    if (found) {
                      setNoteMRN(found.mrn);
                      setNoteBed(found.bedNumber);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {vitals.map(v => (
                    <option key={v.id} value={v.patientName}>
                      {v.patientName} ({v.bedNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Documentation Category</label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="SOAP_SUBJECTIVE">SOAP Subjective / Objective Observation</option>
                  <option value="CARE_PLAN">Nursing Care Plan Progress</option>
                  <option value="OBSERVATION">Special Ward Clinical Observation</option>
                  <option value="SHIFT_HANDOVER">Shift Handover Summary Note</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Digital Clinical Note Entry</label>
                <textarea
                  rows={6}
                  placeholder="Enter detailed nursing observations, patient mobility, fluid balance, wound care response, or handover instructions..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  required
                ></textarea>
              </div>

              <Button type="submit" variant="teal" className="w-full text-xs font-bold py-2.5">
                Save & Commit Digital Record to EHR
              </Button>
            </form>
          </div>

          {/* Electronic Nursing Notes History */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-purple-600" /> Digital EHR Nursing Records Log</span>
              <span className="text-xs text-slate-500 font-normal">Paperless Documentation</span>
            </h2>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">No digital notes logged yet.</p>
              ) : (
                notes.map(n => (
                  <div key={n.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{n.patientName}</span>
                        <span className="text-[11px] text-purple-700 font-semibold ml-2">({n.bedNumber})</span>
                      </div>
                      <Badge variant="outline">{n.category.replace('_', ' ')}</Badge>
                    </div>

                    <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {n.note}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                      <span>Logged by: {n.nurseName}</span>
                      <span>{n.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT VITALS MODAL */}
      {selectedVital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Record Vital Signs — {selectedVital.patientName}
                </h3>
                <p className="text-xs text-slate-500">{selectedVital.bedNumber} ({selectedVital.ward}) • MRN: {selectedVital.mrn}</p>
              </div>
              <button
                onClick={() => setSelectedVital(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 Oxygen (%)</label>
                  <input
                    type="number"
                    value={editSpO2}
                    onChange={(e) => setEditSpO2(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Heart Rate (BPM)</label>
                  <input
                    type="number"
                    value={editHR}
                    onChange={(e) => setEditHR(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editTemp}
                    onChange={(e) => setEditTemp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Systolic</label>
                  <input
                    type="number"
                    value={editSystolic}
                    onChange={(e) => setEditSystolic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Diastolic</label>
                  <input
                    type="number"
                    value={editDiastolic}
                    onChange={(e) => setEditDiastolic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate</label>
                  <input
                    type="number"
                    value={editRespRate}
                    onChange={(e) => setEditRespRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Glucose (mg/dL)</label>
                  <input
                    type="number"
                    value={editGlucose}
                    onChange={(e) => setEditGlucose(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedVital(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="teal" size="sm" disabled={isSavingVitals}>
                  {isSavingVitals ? 'Saving...' : 'Save & Commit Telemetry'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
