import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Activity,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Mail,
  Phone,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  Download,
  Stethoscope,
  HeartPulse,
  Pill,
  CreditCard,
  TestTube,
  UserCheck,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  Play,
  RotateCcw,
  FileSpreadsheet,
  Check,
  Calendar,
  Sliders,
  ChevronRight,
  Gauge
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { authService } from '../../services/authService';
import { getQueuePredictionOverview } from '../../services/queuePredictionService';
import { DepartmentType } from '../../types/queuePrediction';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ANALYTICS' | 'PREDICTIONS' | 'STAFF' | 'REPORTS'>('OVERVIEW');

  // Real-time counter overrides state
  const [counterOverrides, setCounterOverrides] = useState<Record<DepartmentType, { counters: number; queue: number }>>({
    Registration: { counters: 4, queue: 32 },
    OPD: { counters: 3, queue: 86 },
    Laboratory: { counters: 3, queue: 24 },
    Pharmacy: { counters: 4, queue: 41 },
    Billing: { counters: 5, queue: 18 }
  });

  // Action execution message
  const [actionSuccessBanner, setActionSuccessBanner] = useState<string | null>(null);

  // User management state
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Staff creation form state
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('DOCTOR');
  const [staffDepartment, setStaffDepartment] = useState('General Medicine & OPD');
  const [staffRoom, setStaffRoom] = useState('Room 102');
  const [staffPhone, setStaffPhone] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Staff management sub-tab
  const [staffSubTab, setStaffSubTab] = useState<'DOCTORS' | 'NURSES' | 'PHARMACY' | 'COUNTERS' | 'SHIFTS'>('DOCTORS');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Compute live prediction overview using overrides
  const liveOverview = useMemo(() => {
    return getQueuePredictionOverview('RULE_BASED', undefined, {
      Registration: { counters: counterOverrides.Registration.counters, queue: counterOverrides.Registration.queue },
      OPD: { counters: counterOverrides.OPD.counters, queue: counterOverrides.OPD.queue },
      Laboratory: { counters: counterOverrides.Laboratory.counters, queue: counterOverrides.Laboratory.queue },
      Pharmacy: { counters: counterOverrides.Pharmacy.counters, queue: counterOverrides.Pharmacy.queue },
      Billing: { counters: counterOverrides.Billing.counters, queue: counterOverrides.Billing.queue }
    });
  }, [counterOverrides]);

  // Execute recommended actions in real-time
  const handleExecuteAction = (dept: DepartmentType, actionText: string) => {
    setCounterOverrides((prev) => ({
      ...prev,
      [dept]: {
        ...prev[dept],
        counters: prev[dept].counters + 1,
        queue: Math.max(0, prev[dept].queue - 12)
      }
    }));

    setActionSuccessBanner(`Action Executed: Added +1 active counter to ${dept}. Queue bottleneck dampening applied!`);
    setTimeout(() => setActionSuccessBanner(null), 5000);
  };

  // Staff creation submit handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!staffName || !staffEmail || !staffPassword) {
      setFeedbackMsg({ type: 'error', text: 'Please fill name, email, and password' });
      return;
    }

    setIsSubmittingStaff(true);
    try {
      await authService.createStaffAccount({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        departmentName: staffDepartment,
        roomNumber: staffRoom,
        phone: staffPhone
      });

      setFeedbackMsg({ type: 'success', text: `Staff account created for ${staffName} (${staffRole})` });
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      setIsCreatingStaff(false);
      fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create staff account' });
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  // CSV Report Generator
  const handleDownloadReport = (reportType: string) => {
    let filename = `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    let content = '';

    if (reportType === 'Daily_Patients') {
      content = `Patient ID,MRN,Name,Department,CheckIn Time,Status,Priority\n`;
      content += `PT-1001,MRN-88291,John Doe,Registration,08:15 AM,Completed,NORMAL\n`;
      content += `PT-1002,MRN-92014,Sarah Jenkins,OPD,08:30 AM,In Consultation,EMERGENCY\n`;
      content += `PT-1003,MRN-77310,Michael Brown,Laboratory,08:45 AM,Sample Collected,NORMAL\n`;
      content += `PT-1004,MRN-66129,Emily Davis,Pharmacy,09:00 AM,Dispensing,NORMAL\n`;
      content += `PT-1005,MRN-55410,Robert Wilson,Billing,09:15 AM,Paid,NORMAL\n`;
    } else if (reportType === 'Queue_Statistics') {
      content = `Department,Current Queue,Active Counters,Avg Service Mins,Est Wait Mins,Crowd Level\n`;
      Object.entries(liveOverview.predictions).forEach(([dept, p]: [string, any]) => {
        content += `${dept},${p.currentQueue},${p.activeCounters},${p.avgServiceTimeMins},${p.estimatedWaitTimeMins},${p.crowdLevel}\n`;
      });
    } else if (reportType === 'Waiting_Times') {
      content = `Time Slot,Registration Wait,OPD Wait,Lab Wait,Pharmacy Wait,Billing Wait\n`;
      content += `08:00 AM,4 mins,15 mins,8 mins,6 mins,3 mins\n`;
      content += `09:00 AM,12 mins,45 mins,15 mins,18 mins,8 mins\n`;
      content += `10:00 AM,25 mins,95 mins,22 mins,32 mins,14 mins\n`;
      content += `11:00 AM,18 mins,110 mins,19 mins,28 mins,12 mins\n`;
      content += `12:00 PM,10 mins,75 mins,12 mins,20 mins,8 mins\n`;
    } else if (reportType === 'Department_Performance') {
      content = `Department,Throughput Target,Completed Today,Avg Wait Target,Actual Avg Wait,Satisfaction Score\n`;
      content += `Registration,300,285,5 mins,4.2 mins,94%\n`;
      content += `OPD,250,210,15 mins,28.5 mins,88%\n`;
      content += `Laboratory,180,165,10 mins,9.8 mins,96%\n`;
      content += `Pharmacy,350,320,8 mins,7.4 mins,91%\n`;
      content += `Billing,400,390,4 mins,3.8 mins,97%\n`;
    } else if (reportType === 'Staff_Workload') {
      content = `Staff Name,Role,Department,Shift,Active Hours,Patients Served,Status\n`;
      content += `Dr. Aris Vance,Doctor,OPD,Morning,6.5 hrs,32,ON_DUTY\n`;
      content += `Nurse Sarah Jenkins,Nurse,Triage,Morning,7.0 hrs,48,ON_DUTY\n`;
      content += `Pharmacist David Miller,Pharmacy,Pharmacy,Morning,6.0 hrs,85,ON_DUTY\n`;
      content += `Billing Officer Lisa Ray,Billing,Billing,Morning,6.5 hrs,110,ON_DUTY\n`;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mrn && u.mrn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Mock analytics dataset
  const patientsPerHourData = [
    { hour: '08:00 AM', registration: 25, opd: 40, lab: 18, pharmacy: 30, billing: 20 },
    { hour: '09:00 AM', registration: 55, opd: 85, lab: 35, pharmacy: 60, billing: 45 },
    { hour: '10:00 AM', registration: 70, opd: 130, lab: 52, pharmacy: 90, billing: 68 },
    { hour: '11:00 AM', registration: 62, opd: 115, lab: 48, pharmacy: 82, billing: 60 },
    { hour: '12:00 PM', registration: 40, opd: 80, lab: 30, pharmacy: 55, billing: 40 },
    { hour: '01:00 PM', registration: 28, opd: 50, lab: 22, pharmacy: 42, billing: 30 },
    { hour: '02:00 PM', registration: 38, opd: 65, lab: 28, pharmacy: 50, billing: 38 },
    { hour: '03:00 PM', registration: 45, opd: 88, lab: 38, pharmacy: 68, billing: 52 },
    { hour: '04:00 PM', registration: 58, opd: 110, lab: 45, pharmacy: 85, billing: 62 },
    { hour: '05:00 PM', registration: 42, opd: 85, lab: 32, pharmacy: 65, billing: 48 },
    { hour: '06:00 PM', registration: 22, opd: 45, lab: 18, pharmacy: 35, billing: 25 }
  ];

  const waitTimeTrendData = [
    { time: '08:00 AM', Registration: 4, OPD: 15, Lab: 8, Pharmacy: 6, Billing: 3 },
    { time: '09:00 AM', Registration: 12, OPD: 48, Lab: 15, Pharmacy: 18, Billing: 8 },
    { time: '10:00 AM', Registration: 25, OPD: 118, Lab: 22, Pharmacy: 32, Billing: 14 },
    { time: '11:00 AM', Registration: 18, OPD: 168, Lab: 19, Pharmacy: 28, Billing: 12 },
    { time: '12:00 PM', Registration: 10, OPD: 178, Lab: 12, Pharmacy: 20, Billing: 8 },
    { time: '01:00 PM', Registration: 6, OPD: 168, Lab: 8, Pharmacy: 14, Billing: 5 },
    { time: '02:00 PM', Registration: 9, OPD: 168, Lab: 11, Pharmacy: 16, Billing: 7 },
    { time: '03:00 PM', Registration: 14, OPD: 183, Lab: 16, Pharmacy: 22, Billing: 10 }
  ];

  const doctorWorkloadData = [
    { doctor: 'Dr. Vance (OPD)', activeHours: 6.5, patientsSeen: 32, maxCapacity: 40 },
    { doctor: 'Dr. Jenkins (General)', activeHours: 7.0, patientsSeen: 38, maxCapacity: 45 },
    { doctor: 'Dr. Chen (Pediatrics)', activeHours: 5.8, patientsSeen: 26, maxCapacity: 35 },
    { doctor: 'Dr. Rostova (Cardiology)', activeHours: 6.2, patientsSeen: 22, maxCapacity: 30 },
    { doctor: 'Dr. Brody (Ortho)', activeHours: 6.0, patientsSeen: 25, maxCapacity: 35 }
  ];

  const nurseWorkloadData = [
    { nurse: 'Nurse Sarah (Triage)', triageTasks: 48, vitalsTaken: 55, bedsManaged: 12 },
    { nurse: 'Nurse Alex (ICU)', triageTasks: 18, vitalsTaken: 32, bedsManaged: 6 },
    { nurse: 'Nurse Maria (Ward A)', triageTasks: 25, vitalsTaken: 42, bedsManaged: 18 },
    { nurse: 'Nurse David (Emergency)', triageTasks: 52, vitalsTaken: 60, bedsManaged: 10 }
  ];

  // Helper for crowd badges
  const getCrowdBadge = (crowd: string) => {
    switch (crowd) {
      case 'LOW':
        return <Badge variant="success">LOW CROWD</Badge>;
      case 'MODERATE':
        return <Badge variant="info">MODERATE</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HIGH CROWD</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL SURGE</Badge>;
      default:
        return <Badge variant="outline">{crowd}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Hospital Administration Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Executive Command & Queue Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time hospital telemetrics, queue bottleneck dampening, capacity controls, analytics & staff rosters.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shrink-0">
          {[
            { id: 'OVERVIEW', label: 'Command Overview', icon: Gauge },
            { id: 'ANALYTICS', label: 'Analytics Charts', icon: BarChart3 },
            { id: 'PREDICTIONS', label: 'AI Predictions', icon: Sparkles },
            { id: 'STAFF', label: 'Staff & Counters', icon: Users },
            { id: 'REPORTS', label: 'Export Reports', icon: FileSpreadsheet }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs rounded-lg font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <TabIcon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {actionSuccessBanner && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessBanner}</span>
          </div>
          <button onClick={() => setActionSuccessBanner(null)} className="text-emerald-700 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TOP STATISTICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Patients Today</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">342</div>
          <span className="text-[10px] text-emerald-600 font-semibold">+12% vs yesterday</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Patients Inside</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">128</div>
          <span className="text-[10px] text-slate-500 font-semibold">Active in campus</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Doctors</span>
            <Stethoscope className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">24</div>
          <span className="text-[10px] text-indigo-600 font-semibold">In consultation rooms</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Nurses</span>
            <HeartPulse className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">38</div>
          <span className="text-[10px] text-purple-600 font-semibold">On duty across wards</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Appointments Today</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">86</div>
          <span className="text-[10px] text-amber-600 font-semibold">72 checked in</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs bg-rose-50/30 border-rose-200">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Emergency Cases</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">7</div>
          <span className="text-[10px] text-rose-600 font-semibold">Trauma unit active</span>
        </div>
      </div>

      {/* TAB 1: COMMAND OVERVIEW & LIVE QUEUE MONITORING */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* SECTION: RECOMMENDED ACTIONS (Alert Triggers) */}
          <Card className="border-amber-300 bg-amber-50/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-900 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Contextual Operational Recommendations & Capacity Execution</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* OPD Alert */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg shrink-0 mt-0.5">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">OPD Overcrowding Alert</h4>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      "Consider activating additional doctor/counter." (Current OPD Queue: {liveOverview.predictions.OPD.currentQueue} patients)
                    </p>
                  </div>
                </div>

                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => handleExecuteAction('OPD', 'Consider activating additional doctor/counter.')}
                  className="shrink-0 text-xs font-bold"
                >
                  Deploy OPD Doctor / Counter
                </Button>
              </div>

              {/* Pharmacy Alert */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg shrink-0 mt-0.5">
                    <Pill className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Pharmacy Queue Surge</h4>
                    <p className="text-xs text-emerald-800 font-medium mt-0.5">
                      "Activate express pickup counter." (Current Pharmacy Queue: {liveOverview.predictions.Pharmacy.currentQueue} patients)
                    </p>
                  </div>
                </div>

                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => handleExecuteAction('Pharmacy', 'Activate express pickup counter.')}
                  className="shrink-0 text-xs font-bold"
                >
                  Activate Express Counter
                </Button>
              </div>

              {/* Billing Alert */}
              <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Billing Cashier Queue</h4>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      "Open additional billing counter." (Current Billing Queue: {liveOverview.predictions.Billing.currentQueue} patients)
                    </p>
                  </div>
                </div>

                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => handleExecuteAction('Billing', 'Open additional billing counter.')}
                  className="shrink-0 text-xs font-bold"
                >
                  Open Billing Counter 6
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SECTION: LIVE QUEUE MONITORING CARDS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <Activity className="h-4 w-4 text-sky-600" />
                <span>Live Departmental Queue Monitoring Deck</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">5 Live Departmental Nodes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {(['Registration', 'OPD', 'Laboratory', 'Pharmacy', 'Billing'] as DepartmentType[]).map((dept) => {
                const pred = liveOverview.predictions[dept];
                return (
                  <Card key={dept} className="border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="p-3.5 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-extrabold text-slate-900">{dept}</CardTitle>
                      {getCrowdBadge(pred.crowdLevel)}
                    </CardHeader>

                    <CardContent className="p-3.5 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Queue</span>
                        <div className="text-xl font-black text-slate-900">{pred.currentQueue} Patients</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-xl">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Est. Wait</span>
                          <span className="font-extrabold text-amber-700">~{pred.estimatedWaitTimeMins}m</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Counters</span>
                          <span className="font-bold text-slate-800">{pred.activeCounters} Active</span>
                        </div>
                      </div>

                      <div className="text-[10px] space-y-1 border-t border-slate-100 pt-2 text-slate-600">
                        <div className="flex justify-between">
                          <span>30m Forecast:</span>
                          <strong className="text-slate-900">{pred.predictedQueue30Mins} pts</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>60m Forecast:</span>
                          <strong className="text-slate-900">{pred.predictedQueue60Mins} pts</strong>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteAction(dept, 'Expand Capacity')}
                        className="w-full text-[10px] font-bold h-7 py-0"
                      >
                        + Add Counter
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* SECTION: HOSPITAL-WIDE CROWD VISUALIZATION */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span>Hospital-Wide Crowd Density Visualization</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Facility occupancy levels categorized across LOW, MODERATE, HIGH, and CRITICAL thresholds.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { name: 'Registration', crowd: liveOverview.predictions.Registration.crowdLevel, queue: liveOverview.predictions.Registration.currentQueue },
                  { name: 'OPD', crowd: liveOverview.predictions.OPD.crowdLevel, queue: liveOverview.predictions.OPD.currentQueue },
                  { name: 'Laboratory', crowd: liveOverview.predictions.Laboratory.crowdLevel, queue: liveOverview.predictions.Laboratory.currentQueue },
                  { name: 'Pharmacy', crowd: liveOverview.predictions.Pharmacy.crowdLevel, queue: liveOverview.predictions.Pharmacy.currentQueue },
                  { name: 'Billing', crowd: liveOverview.predictions.Billing.crowdLevel, queue: liveOverview.predictions.Billing.currentQueue },
                  { name: 'Emergency', crowd: 'HIGH', queue: 14 }
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                      item.crowd === 'CRITICAL'
                        ? 'bg-rose-50 border-rose-300 text-rose-950'
                        : item.crowd === 'HIGH'
                        ? 'bg-amber-50 border-amber-300 text-amber-950'
                        : item.crowd === 'MODERATE'
                        ? 'bg-sky-50 border-sky-300 text-sky-950'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider block">{item.name}</span>
                      <span className="text-xl font-black block mt-1">{item.queue} <span className="text-[10px] font-normal">queued</span></span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase">{item.crowd}</span>
                      <span className="h-2 w-2 rounded-full animate-ping bg-current" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ANALYTICS CHARTS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Patients Per Hour */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-extrabold text-slate-900">Patients Per Hour (Arrivals)</CardTitle>
                <CardDescription className="text-xs text-slate-500">Hourly patient intake volume by department</CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patientsPerHourData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="opd" name="OPD" stackId="1" stroke="#6366f1" fill="#818cf8" />
                    <Area type="monotone" dataKey="pharmacy" name="Pharmacy" stackId="1" stroke="#10b981" fill="#34d399" />
                    <Area type="monotone" dataKey="billing" name="Billing" stackId="1" stroke="#f59e0b" fill="#fbbf24" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2: Waiting Time Trend */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-extrabold text-slate-900">Waiting Time Trend (Minutes)</CardTitle>
                <CardDescription className="text-xs text-slate-500">Average wait time progression across departments</CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={waitTimeTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="OPD" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Pharmacy" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="Registration" stroke="#0284c7" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3: Department Workload Breakdown */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-extrabold text-slate-900">Department Workload vs Target</CardTitle>
                <CardDescription className="text-xs text-slate-500">Current active workload load distribution</CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientsPerHourData.slice(1, 7)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="opd" name="OPD Workload" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pharmacy" name="Pharmacy Workload" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="lab" name="Lab Diagnostics" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4: Doctor Workload */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-extrabold text-slate-900">Doctor Workload & Capacity</CardTitle>
                <CardDescription className="text-xs text-slate-500">Patients seen per doctor vs max daily capacity</CardDescription>
              </CardHeader>
              <CardContent className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={doctorWorkloadData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="doctor" type="category" tick={{ fontSize: 9 }} width={120} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="patientsSeen" name="Patients Consulted" fill="#0284c7" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="maxCapacity" name="Max Capacity" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: PREDICTIONS */}
      {activeTab === 'PREDICTIONS' && (
        <div className="space-y-6">
          <Card className="border-sky-200 bg-gradient-to-r from-slate-900 to-sky-950 text-white shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 bg-sky-500/20 border border-sky-400/30 rounded-xl text-sky-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">AI Hospital Demand & Surge Predictor</h3>
                  <p className="text-xs text-sky-200">
                    Calculated queue projections for the next 30 minutes, 60 minutes, and peak hour bottlenecks.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-sky-300 uppercase block">30-Min Queue Projection</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {Object.values(liveOverview.predictions).reduce((acc: number, p: any) => acc + p.predictedQueue30Mins, 0)} <span className="text-xs font-normal text-slate-300">patients</span>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-sky-300 uppercase block">60-Min Queue Projection</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {Object.values(liveOverview.predictions).reduce((acc: number, p: any) => acc + p.predictedQueue60Mins, 0)} <span className="text-xs font-normal text-slate-300">patients</span>
                  </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Peak Expected Hours</span>
                  <div className="text-base font-black text-amber-300 mt-1">
                    10:30 AM – 11:30 AM
                  </div>
                  <span className="text-[10px] text-slate-300">And 04:00 PM – 05:00 PM</span>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                  <span className="text-[10px] font-bold text-rose-300 uppercase block">Overcrowding Risk</span>
                  <div className="text-base font-black text-rose-300 mt-1">
                    OPD & Pharmacy
                  </div>
                  <span className="text-[10px] text-slate-300">Trigger capacity response</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Departmental Forecast Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Departmental 30m & 60m Demand Forecast Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-600 border-b">
                  <tr>
                    <th className="p-3">Department</th>
                    <th className="p-3">Current Queue</th>
                    <th className="p-3">In 30 Mins</th>
                    <th className="p-3">In 60 Mins</th>
                    <th className="p-3">Projected Crowd</th>
                    <th className="p-3">Recommended Mitigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-800">
                  {Object.entries(liveOverview.predictions).map(([dept, p]: [string, any]) => (
                    <tr key={dept} className="hover:bg-slate-50">
                      <td className="p-3 font-extrabold text-slate-900">{dept}</td>
                      <td className="p-3">{p.currentQueue} patients</td>
                      <td className="p-3 font-bold text-sky-700">{p.predictedQueue30Mins} patients</td>
                      <td className="p-3 font-bold text-indigo-700">{p.predictedQueue60Mins} patients</td>
                      <td className="p-3">{getCrowdBadge(p.crowdLevel)}</td>
                      <td className="p-3 text-slate-600 font-medium">{p.recommendedAction}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: STAFF & COUNTERS MANAGEMENT */}
      {activeTab === 'STAFF' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Hospital Staff & Capacity Management</h3>
              <p className="text-xs text-slate-500">Control active rosters, shift allocations, counters and issue credentials.</p>
            </div>

            <Button
              variant="teal"
              size="sm"
              onClick={() => setIsCreatingStaff(!isCreatingStaff)}
              className="flex items-center gap-2 shrink-0 font-bold"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isCreatingStaff ? 'Close Form' : 'Create Staff Credential'}</span>
            </Button>
          </div>

          {feedbackMsg && (
            <div
              className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Staff Creation Form */}
          {isCreatingStaff && (
            <div className="bg-white rounded-2xl border border-teal-200 shadow-xl p-6 animate-fade-in">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h2 className="text-lg font-bold text-slate-900">Provision Staff Credential</h2>
                </div>
                <span className="text-xs text-slate-500 font-mono">Role-Based Staff Registration</span>
              </div>

              <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Role Type</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="DOCTOR">Doctor</option>
                    <option value="NURSE">Nurse</option>
                    <option value="PHARMACY">Pharmacy Staff</option>
                    <option value="ATTENDER">Patient Attender / Guide</option>
                    <option value="ADMIN">Co-Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Dr. Maya Patel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Staff Email Address</label>
                  <input
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="staff@smarthospital.org"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Secure Password</label>
                  <input
                    type="password"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="At least 6 chars"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Department / Station</label>
                  <input
                    type="text"
                    value={staffDepartment}
                    onChange={(e) => setStaffDepartment(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Room / Counter #</label>
                  <input
                    type="text"
                    value={staffRoom}
                    onChange={(e) => setStaffRoom(e.target.value)}
                    placeholder="Room 205"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreatingStaff(false)}>Cancel</Button>
                  <Button type="submit" variant="teal" disabled={isSubmittingStaff}>
                    {isSubmittingStaff ? 'Creating Account...' : 'Issue Staff Credentials'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* User Accounts Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-base font-extrabold text-slate-900">Hospital Staff Account Directory</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff, email..."
                  className="px-3 py-1.5 rounded-xl border text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] font-bold border-b">
                  <tr>
                    <th className="px-4 py-3">User Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Email / Contact</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                      <td className="px-4 py-3"><Badge variant="info">{u.role}</Badge></td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.departmentName || 'General'}</td>
                      <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOWNLOADABLE DEMO REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-5 border-b border-slate-100">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span>Downloadable Operational & Telemetry Demo Reports</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Generate and download formatted CSV data files for daily audits and executive reporting.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Daily Patients Log', desc: 'Complete log of registered patients, check-in times, MRN and status.', id: 'Daily_Patients' },
                { title: 'Queue Statistics Report', desc: 'Current departmental queue lengths, active counters, and throughput.', id: 'Queue_Statistics' },
                { title: 'Waiting Times Analytics', desc: 'Hourly wait time logs across OPD, Pharmacy, Lab, and Registration.', id: 'Waiting_Times' },
                { title: 'Department Performance Summary', desc: 'Throughput target compliance and patient satisfaction ratings.', id: 'Department_Performance' },
                { title: 'Staff Workload & Shift Log', desc: 'Consultation counts, nurse triage logs, and shift active hours.', id: 'Staff_Workload' }
              ].map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-all space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{rep.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{rep.desc}</p>
                    </div>
                  </div>

                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => handleDownloadReport(rep.id)}
                    className="w-full text-xs font-bold flex items-center justify-center space-x-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download {rep.id}.csv</span>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
