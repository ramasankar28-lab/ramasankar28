import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  QueueToken,
  Doctor,
  Department,
  PriorityLevel,
  Appointment,
  PharmacyOrder,
  BillingInvoice,
  HospitalLocation,
  MedicalRecordsData,
  NotificationItem,
  NotificationCategory
} from '../../types';
import { hospitalService } from '../../services/hospitalService';
import {
  User,
  Clock,
  Ticket,
  Building2,
  Stethoscope,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Phone,
  Heart,
  Plus,
  Search,
  FileText,
  Pill,
  TestTube,
  CreditCard,
  Bell,
  RefreshCw,
  Trash2,
  Edit3,
  Filter,
  ChevronRight,
  Download,
  Users,
  ShieldAlert,
  Check,
  Eye,
  Sparkles,
  Info,
  Activity
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface PatientDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export function PatientDashboard({ onNavigateTab }: PatientDashboardProps) {
  const { user } = useAuth();

  // Active Main Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'appointments' | 'token' | 'records' | 'navigation' | 'notifications'
  >('overview');

  // Backend Data State
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<PharmacyOrder[]>([]);
  const [billingInvoices, setBillingInvoices] = useState<BillingInvoice[]>([]);
  const [locations, setLocations] = useState<HospitalLocation[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordsData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Token Form State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('dept-1');
  const [selectedDocId, setSelectedDocId] = useState<string>('doc-1');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [isIssuingToken, setIsIssuingToken] = useState(false);

  // Appointment Form & Action State
  const [aptSearch, setAptSearch] = useState('');
  const [aptDeptFilter, setAptDeptFilter] = useState('ALL');
  const [showBookAptModal, setShowBookAptModal] = useState(false);
  const [bookDocId, setBookDocId] = useState('');
  const [bookDate, setBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookTimeSlot, setBookTimeSlot] = useState('10:00 AM');
  const [bookType, setBookType] = useState<'OPD' | 'FOLLOW_UP' | 'TELE_CONSULT'>('OPD');
  const [bookSymptoms, setBookSymptoms] = useState('');
  const [isBookingApt, setIsBookingApt] = useState(false);

  // Reschedule Appointment State
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleSlot, setNewRescheduleSlot] = useState('10:30 AM');

  // Navigation Search & Filter
  const [navSearch, setNavSearch] = useState('');
  const [navCategory, setNavCategory] = useState<string>('ALL');

  // Notifications Filter
  const [notifCategory, setNotifCategory] = useState<string>('ALL');

  // Medical Records Sub-Tab
  const [recordsTab, setRecordsTab] = useState<'history' | 'prescriptions' | 'labs' | 'previous'>('history');

  const fetchAllPatientData = async () => {
    setIsLoading(true);
    try {
      const mrn = user?.mrn || 'MRN-2026-8812';

      const [
        fetchedTokens,
        fetchedDepts,
        fetchedDocs,
        fetchedApts,
        fetchedPharmacy,
        fetchedBilling,
        fetchedLocs,
        fetchedRecords,
        fetchedNotifs
      ] = await Promise.all([
        hospitalService.getTokens(),
        hospitalService.getDepartments(),
        hospitalService.getDoctors(),
        hospitalService.getAppointments(),
        hospitalService.getPharmacyOrders(),
        hospitalService.getBillingInvoices(),
        hospitalService.getLocations(),
        hospitalService.getMedicalRecords(mrn),
        hospitalService.getNotifications(mrn)
      ]);

      // Filter or set tokens matching patient MRN or name
      const pTokens = fetchedTokens.filter(
        (t) =>
          (user?.mrn && t.mrn === user.mrn) ||
          (user?.name && t.patientName.toLowerCase().includes(user.name.toLowerCase()))
      );
      setTokens(pTokens.length > 0 ? pTokens : fetchedTokens.slice(0, 3));

      setDepartments(fetchedDepts);
      setDoctors(fetchedDocs);

      // Filter patient appointments
      const pApts = fetchedApts.filter(
        (a) =>
          a.patientName.toLowerCase().includes((user?.name || 'david').toLowerCase()) ||
          a.mrn === user?.mrn ||
          a.patientPhone === user?.phone
      );
      setAppointments(pApts.length > 0 ? pApts : fetchedApts);

      // Filter pharmacy orders
      const pPharm = fetchedPharmacy.filter(
        (p) => p.mrn === mrn || p.patientName.toLowerCase().includes((user?.name || 'david').toLowerCase())
      );
      setPharmacyOrders(pPharm.length > 0 ? pPharm : fetchedPharmacy);

      // Filter billing invoices
      const invoiceList = (fetchedBilling as any).invoices || fetchedBilling;
      const pBill = invoiceList.filter(
        (b: any) => b.mrn === mrn || b.patientName.toLowerCase().includes((user?.name || 'david').toLowerCase())
      );
      setBillingInvoices(pBill.length > 0 ? pBill : invoiceList);

      setLocations(fetchedLocs);
      setMedicalRecords(fetchedRecords);
      setNotifications(fetchedNotifs);
    } catch (err: any) {
      console.error('Failed to load patient dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPatientData();
  }, [user]);

  // Derive Active Token & Token Metrics
  const myActiveToken =
    tokens.find((t) => ['WAITING', 'IN_CONSULTATION'].includes(t.status)) || tokens[0] || null;

  // Derive Today's Appointment
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointment =
    appointments.find(
      (a) => (a.date === todayStr || a.date === '2026-08-12') && a.status === 'CONFIRMED'
    ) || appointments.find((a) => a.status === 'CONFIRMED') || null;

  // Calculate Queue Statistics for Active Token
  const doctorForActiveToken = doctors.find((d) => d.id === myActiveToken?.doctorId) || doctors[0];
  const waitingTokensForDoctor = tokens.filter(
    (t) => t.doctorId === doctorForActiveToken?.id && t.status === 'WAITING'
  );
  
  // Calculate Patients Ahead
  const patientsAhead = myActiveToken
    ? Math.max(0, waitingTokensForDoctor.filter((t) => t.sequenceNo < myActiveToken.sequenceNo).length)
    : 0;

  // Active Doctor Status
  const activeDoctorStatus = doctorForActiveToken
    ? doctorForActiveToken.isAvailable
      ? `Available (${doctorForActiveToken.roomNumber})`
      : 'On Break / In Consultation'
    : 'Available';

  // Active Pharmacy Status
  const activePharmacyOrder = pharmacyOrders[0] || null;
  const pharmacyStatusText = activePharmacyOrder
    ? activePharmacyOrder.status === 'READY_FOR_PICKUP'
      ? 'Ready for Pickup'
      : activePharmacyOrder.status === 'DISPENSED'
      ? 'Dispensed'
      : 'Preparing Medications'
    : 'No Pending Orders';

  // Active Laboratory Status
  const activeLabReport = medicalRecords?.labReports?.[0] || null;
  const labStatusText = activeLabReport
    ? activeLabReport.status === 'COMPLETED'
      ? 'Report Completed'
      : activeLabReport.status === 'IN_ANALYSIS'
      ? 'In Analysis'
      : 'Sample Collected'
    : 'No Active Tests';

  // Active Billing Status
  const activeInvoice = billingInvoices[0] || null;
  const billingStatusText = activeInvoice
    ? activeInvoice.status === 'PAID'
      ? `Paid ($${activeInvoice.amount.toFixed(2)})`
      : activeInvoice.status === 'INSURANCE_PROCESSING'
      ? 'Insurance Claim Processing'
      : `Pending ($${activeInvoice.amount.toFixed(2)})`
    : 'No Unpaid Bills';

  // Handle Token Generation
  const handleIssueToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuingToken(true);
    setFeedbackMsg(null);
    try {
      const newToken = await hospitalService.issueToken({
        patientName: user?.name || 'David Miller',
        patientPhone: user?.phone || '+1 (555) 234-5678',
        departmentId: selectedDeptId,
        doctorId: selectedDocId,
        priority
      });

      setTokens([newToken, ...tokens]);
      setFeedbackMsg({
        text: `Live Digital Token #${newToken.tokenNumber} issued successfully! Counter: ${newToken.counterNumber}`,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to issue digital token', type: 'error' });
    } finally {
      setIsIssuingToken(false);
    }
  };

  // Handle Book Appointment
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookDocId) {
      setFeedbackMsg({ text: 'Please select a consulting doctor', type: 'error' });
      return;
    }
    setIsBookingApt(true);
    setFeedbackMsg(null);
    try {
      const newApt = await hospitalService.bookAppointment({
        patientName: user?.name || 'David Miller',
        patientPhone: user?.phone || '+1 (555) 234-5678',
        doctorId: bookDocId,
        date: bookDate,
        timeSlot: bookTimeSlot,
        type: bookType,
        symptoms: bookSymptoms
      });

      setAppointments([newApt, ...appointments]);
      setShowBookAptModal(false);
      setBookSymptoms('');
      setFeedbackMsg({
        text: `Appointment booked successfully with ${newApt.doctorName} for ${newApt.date} at ${newApt.timeSlot}`,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to book appointment', type: 'error' });
    } finally {
      setIsBookingApt(false);
    }
  };

  // Handle Reschedule Appointment
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleApt) return;
    try {
      const updated = await hospitalService.updateAppointment(rescheduleApt.id, {
        date: newRescheduleDate,
        timeSlot: newRescheduleSlot,
        status: 'CONFIRMED'
      });

      setAppointments(appointments.map((a) => (a.id === updated.id ? updated : a)));
      setRescheduleApt(null);
      setFeedbackMsg({
        text: `Appointment with ${updated.doctorName} rescheduled to ${updated.date} at ${updated.timeSlot}.`,
        type: 'success'
      });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to reschedule appointment', type: 'error' });
    }
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = async (id: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to cancel your appointment with ${docName}?`)) return;
    try {
      await hospitalService.cancelAppointment(id);
      setAppointments(
        appointments.map((a) => (a.id === id ? { ...a, status: 'CANCELLED' as const } : a))
      );
      setFeedbackMsg({ text: `Appointment with ${docName} cancelled successfully.`, type: 'info' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Failed to cancel appointment', type: 'error' });
    }
  };

  // Filter Doctors for Appointment Search
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(aptSearch.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(aptSearch.toLowerCase()) ||
      doc.departmentName.toLowerCase().includes(aptSearch.toLowerCase());
    const matchesDept = aptDeptFilter === 'ALL' || doc.departmentId === aptDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Filter Locations for Navigation
  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(navSearch.toLowerCase()) ||
      loc.wing.toLowerCase().includes(navSearch.toLowerCase()) ||
      loc.floor.toLowerCase().includes(navSearch.toLowerCase());
    const matchesCategory = navCategory === 'ALL' || loc.category === navCategory;
    return matchesSearch && matchesCategory;
  });

  // Filter Notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifCategory === 'ALL') return true;
    return n.category === notifCategory;
  });

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleMarkNotifRead = async (id: string) => {
    try {
      await hospitalService.markNotificationRead(id);
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      // Fallback
      setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await hospitalService.markAllNotificationsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    } catch {
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Welcome Header & MRN Badge */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-teal-800/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span>Smart Patient Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome, {user?.name || 'David Miller'}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/80 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>MRN: <strong className="text-amber-300 font-mono">{user?.mrn || 'MRN-2026-8812'}</strong></span>
            <span>&bull;</span>
            <span>Phone: {user?.phone || '+1 (555) 234-5678'}</span>
            <span>&bull;</span>
            <span>DOB: {user?.dob || '1988-05-14'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="teal"
            onClick={() => {
              setBookDocId(doctors[0]?.id || 'doc-1');
              setShowBookAptModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </Button>
          <Button
            variant="outline"
            onClick={fetchAllPatientData}
            className="flex items-center gap-1.5 text-xs text-white border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-teal-400' : ''}`} />
            <span>Sync Portal</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between gap-3 shadow-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-900'
              : 'bg-sky-50 border border-sky-200 text-sky-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {feedbackMsg.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            {feedbackMsg.type === 'info' && <Info className="w-5 h-5 text-sky-600 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Portal Navigation Sub-Header Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'overview'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Dashboard Cards & Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('appointments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'appointments'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Appointments</span>
          {appointments.filter((a) => a.status === 'CONFIRMED').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold">
              {appointments.filter((a) => a.status === 'CONFIRMED').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('token')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'token'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>OPD Token</span>
          {myActiveToken && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-extrabold">
              #{myActiveToken.tokenNumber}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'records'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Medical Records</span>
        </button>

        <button
          onClick={() => setActiveSubTab('navigation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'navigation'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Hospital Navigation</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'notifications'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
          {unreadNotifCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DASHBOARD CARDS GRID (10 MANDATORY METRICS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Patient Status Console</h2>
              <p className="text-xs text-slate-500">Live operational stats and real-time medical updates</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">10 Live Status Metrics</span>
          </div>

          {/* 10 Required Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Card 1: Today's Appointment */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Today's Appointment
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {todayAppointment ? todayAppointment.doctorName : 'No Appointment Today'}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {todayAppointment
                  ? `${todayAppointment.timeSlot} (${todayAppointment.departmentName})`
                  : 'Book a doctor visit anytime'}
              </p>
              <div className="mt-3">
                <Badge variant={todayAppointment ? 'success' : 'default'}>
                  {todayAppointment ? todayAppointment.status : 'Idle'}
                </Badge>
              </div>
            </div>

            {/* Card 2: Token Number */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                  My Token Number
                </span>
                <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
                  <Ticket className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                {myActiveToken ? `#${myActiveToken.tokenNumber}` : 'None'}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate">
                {myActiveToken ? `${myActiveToken.departmentName}` : 'No active token issued'}
              </p>
              <div className="mt-3">
                <Badge variant={myActiveToken ? 'teal' : 'default'}>
                  {myActiveToken ? myActiveToken.counterNumber : 'Desk 0'}
                </Badge>
              </div>
            </div>

            {/* Card 3: Current Token Calling */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Current Token
                </span>
                <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-sky-700 font-mono">
                {myActiveToken ? `#${doctorForActiveToken?.currentTokenNumber || '104'}` : '#104'}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {doctorForActiveToken ? `Room: ${doctorForActiveToken.roomNumber}` : 'Room 102'}
              </p>
              <div className="mt-3">
                <Badge variant="info">Active In Consultation</Badge>
              </div>
            </div>

            {/* Card 4: Patients Ahead */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Patients Ahead
                </span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900">{patientsAhead}</div>
              <p className="text-xs text-slate-500 mt-1">Waiting in line before you</p>
              <div className="mt-3">
                <Badge variant={patientsAhead === 0 ? 'success' : 'warning'}>
                  {patientsAhead === 0 ? 'Next Up!' : 'Queue Active'}
                </Badge>
              </div>
            </div>

            {/* Card 5: Estimated Waiting Time */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Estimated Wait Time
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-emerald-600">
                {myActiveToken ? `${myActiveToken.estimatedWaitMinutes} mins` : '0 mins'}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">Calculated via live AI queue</p>
              <div className="mt-3">
                <Badge variant="success">Real-Time Sync</Badge>
              </div>
            </div>

            {/* Card 6: Queue Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Queue Status
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {myActiveToken ? myActiveToken.status : 'Normal Flow'}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                Priority: {myActiveToken ? myActiveToken.priority : 'Normal'}
              </p>
              <div className="mt-3">
                <Badge variant="purple">OPD Flow Active</Badge>
              </div>
            </div>

            {/* Card 7: Doctor Availability */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Doctor Availability
                </span>
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <Stethoscope className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {activeDoctorStatus}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {doctorForActiveToken ? doctorForActiveToken.name : 'Dr. Aris Vance'}
              </p>
              <div className="mt-3">
                <Badge variant={doctorForActiveToken?.isAvailable ? 'success' : 'warning'}>
                  {doctorForActiveToken?.isAvailable ? 'In Room & Available' : 'Consulting'}
                </Badge>
              </div>
            </div>

            {/* Card 8: Pharmacy Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pharmacy Status
                </span>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {pharmacyStatusText}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {activePharmacyOrder ? `Order: ${activePharmacyOrder.orderNumber}` : 'Express Counter #2'}
              </p>
              <div className="mt-3">
                <Badge variant={activePharmacyOrder?.status === 'READY_FOR_PICKUP' ? 'success' : 'purple'}>
                  {activePharmacyOrder?.pickupCounter || 'Counter #2'}
                </Badge>
              </div>
            </div>

            {/* Card 9: Laboratory Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Laboratory Status
                </span>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <TestTube className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">{labStatusText}</div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {activeLabReport ? activeLabReport.testName : 'Pathology Lab Floor 1'}
              </p>
              <div className="mt-3">
                <Badge variant={activeLabReport?.status === 'COMPLETED' ? 'success' : 'danger'}>
                  {activeLabReport?.status || 'No Tests'}
                </Badge>
              </div>
            </div>

            {/* Card 10: Billing Status */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Billing Status
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-extrabold text-slate-900 truncate">
                {billingStatusText}
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {activeInvoice ? `Inv: ${activeInvoice.invoiceNumber}` : 'Central Cashier Desk'}
              </p>
              <div className="mt-3">
                <Badge variant={activeInvoice?.status === 'PAID' ? 'success' : 'warning'}>
                  {activeInvoice?.status || 'Clear'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Access & Patient Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Active OPD Ticket Console */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Active Digital OPD Token Ticket</h3>
                </div>
                {myActiveToken && (
                  <Badge variant={myActiveToken.status === 'IN_CONSULTATION' ? 'success' : 'teal'}>
                    {myActiveToken.status === 'IN_CONSULTATION' ? 'Inside Doctor Room' : 'Waiting in Queue'}
                  </Badge>
                )}
              </div>

              {myActiveToken ? (
                <div className="bg-slate-900 rounded-xl p-5 text-white shadow-inner relative overflow-hidden border border-slate-800">
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-[11px] font-mono text-teal-400 uppercase tracking-widest block">
                        DIGITAL TICKET ID
                      </span>
                      <div className="text-4xl font-extrabold text-amber-400 font-mono tracking-tight mt-1">
                        #{myActiveToken.tokenNumber}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
                        Assigned Counter
                      </span>
                      <div className="text-lg font-bold text-teal-300">{myActiveToken.counterNumber}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Department</span>
                      <span className="font-semibold text-white">{myActiveToken.departmentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Consulting Doctor</span>
                      <span className="font-semibold text-white">{myActiveToken.doctorName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Estimated Wait</span>
                      <span className="font-bold text-emerald-400">
                        {myActiveToken.status === 'IN_CONSULTATION'
                          ? '0 min (Consulting)'
                          : `~${myActiveToken.estimatedWaitMinutes} mins`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Issue Time: {myActiveToken.issueTime}</span>
                    <button
                      type="button"
                      onClick={() => setActiveSubTab('navigation')}
                      className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Navigate to {myActiveToken.counterNumber}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold">No active token generated currently.</p>
                  <p className="text-xs text-slate-400 mt-1">Switch to the "OPD Token" tab to generate a ticket.</p>
                </div>
              )}
            </div>

            {/* Patient Profile Card */}
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-teal-600" /> Registered Patient Profile
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Full Name</span>
                  <span className="font-bold text-slate-900">{user?.name || 'David Miller'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Medical Record No. (MRN)</span>
                  <span className="font-mono font-bold text-teal-700">{user?.mrn || 'MRN-2026-8812'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Gender / DOB</span>
                  <span className="font-semibold">{user?.gender || 'Male'} ({user?.dob || '1988-05-14'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Emergency Attender</span>
                  <span className="font-bold text-rose-700">{user?.emergencyContactName || 'Sarah Miller'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Attender Phone</span>
                  <span className="font-mono font-semibold">{user?.emergencyContactPhone || '+1 (555) 999-8888'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. APPOINTMENTS MODULE (BOOK, SEARCH, CANCEL, RESCHEDULE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Appointment Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Book, reschedule, or cancel consultations with specialist doctors
              </p>
            </div>
            <Button
              variant="teal"
              size="sm"
              onClick={() => {
                setBookDocId(doctors[0]?.id || 'doc-1');
                setShowBookAptModal(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Book New Appointment
            </Button>
          </div>

          {/* Book Appointment Modal / Form */}
          {showBookAptModal && (
            <div className="bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-teal-600" /> Book OPD Consultation
                  </h3>
                  <button
                    onClick={() => setShowBookAptModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Consulting Doctor</label>
                    <select
                      value={bookDocId}
                      onChange={(e) => setBookDocId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-500"
                      required
                    >
                      <option value="">-- Choose Specialist Doctor --</option>
                      {doctors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.specialization} - {d.departmentName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Appointment Date</label>
                      <input
                        type="date"
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Available Slot</label>
                      <select
                        value={bookTimeSlot}
                        onChange={(e) => setBookTimeSlot(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="09:30 AM">09:30 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:15 AM">11:15 AM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="03:30 PM">03:30 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Consultation Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['OPD', 'FOLLOW_UP', 'TELE_CONSULT'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBookType(t)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                            bookType === t
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms / Notes</label>
                    <textarea
                      value={bookSymptoms}
                      onChange={(e) => setBookSymptoms(e.target.value)}
                      placeholder="Briefly describe symptoms or purpose of visit..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBookAptModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="teal" size="sm" disabled={isBookingApt}>
                      {isBookingApt ? 'Confirming...' : 'Confirm Booking'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reschedule Modal */}
          {rescheduleApt && (
            <div className="bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-teal-600" /> Reschedule Appointment
                  </h3>
                  <button onClick={() => setRescheduleApt(null)} className="text-slate-400 hover:text-slate-700">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleRescheduleSubmit} className="space-y-4 mt-4 text-xs">
                  <p className="text-slate-600">
                    Rescheduling visit with <strong>{rescheduleApt.doctorName}</strong> ({rescheduleApt.departmentName})
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Date</label>
                    <input
                      type="date"
                      value={newRescheduleDate}
                      onChange={(e) => setNewRescheduleDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Time Slot</label>
                    <select
                      value={newRescheduleSlot}
                      onChange={(e) => setNewRescheduleSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:45 AM">11:45 AM</option>
                      <option value="02:15 PM">02:15 PM</option>
                      <option value="04:00 PM">04:00 PM</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setRescheduleApt(null)}>
                      Close
                    </Button>
                    <Button type="submit" variant="teal" size="sm">
                      Save New Slot
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Active Appointments List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              My Scheduled Appointments
            </h3>

            {appointments.filter((a) => a.status !== 'CANCELLED').length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No active scheduled appointments</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments
                  .filter((a) => a.status !== 'CANCELLED')
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">
                              {apt.departmentName}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-0.5">{apt.doctorName}</h4>
                          </div>
                          <Badge variant={apt.status === 'CONFIRMED' ? 'success' : 'default'}>
                            {apt.status}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-teal-600" /> {apt.date}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> {apt.timeSlot}
                          </span>
                        </div>

                        {apt.symptoms && (
                          <p className="text-[11px] text-slate-500 mt-2 bg-white p-2 rounded-lg border border-slate-100 italic">
                            "{apt.symptoms}"
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRescheduleApt(apt);
                            setNewRescheduleDate(apt.date);
                            setNewRescheduleSlot(apt.timeSlot);
                          }}
                          className="text-xs text-slate-700 hover:text-teal-700"
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1" /> Reschedule
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelAppointment(apt.id, apt.doctorName)}
                          className="text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Search Doctors Catalog */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Hospital Doctor Directory</h3>
                <p className="text-xs text-slate-500">Find doctors by name, specialty, or department</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={aptSearch}
                    onChange={(e) => setAptSearch(e.target.value)}
                    placeholder="Search doctor or specialty..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                  />
                </div>

                <select
                  value={aptDeptFilter}
                  onChange={(e) => setAptDeptFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="ALL">All Depts</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:border-teal-300 hover:bg-white transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                          {doc.name.substring(4, 6).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                          <span className="text-[10px] text-teal-700 font-medium block">
                            {doc.specialization}
                          </span>
                        </div>
                      </div>
                      <Badge variant={doc.isAvailable ? 'success' : 'warning'}>
                        {doc.isAvailable ? 'Available' : 'On Break'}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                      <p>
                        <strong>Department:</strong> {doc.departmentName}
                      </p>
                      <p>
                        <strong>Room Location:</strong> {doc.roomNumber}
                      </p>
                      <p>
                        <strong>Shift Hours:</strong> {doc.shiftStart} - {doc.shiftEnd}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Max: {doc.maxDailyPatients} pts/day</span>
                    <Button
                      variant="teal"
                      size="sm"
                      onClick={() => {
                        setBookDocId(doc.id);
                        setShowBookAptModal(true);
                      }}
                      className="text-xs"
                    >
                      Book Visit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TOKEN MODULE (DIGITAL TOKEN DISPLAY & GENERATOR) */}
      {/* ========================================================================= */}
      {activeSubTab === 'token' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Live Digital OPD Token Ticket</h2>
                <p className="text-xs text-slate-500">Real-time OPD queue sequence tracking</p>
              </div>
              <Badge variant="teal">Real-Time Sync</Badge>
            </div>

            {/* Display Token Details */}
            {myActiveToken ? (
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs text-teal-400 uppercase font-mono tracking-widest block">
                      YOUR OPD TOKEN NUMBER
                    </span>
                    <div className="text-5xl font-black text-amber-400 font-mono tracking-tight mt-1">
                      #{myActiveToken.tokenNumber}
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-xs text-slate-400 uppercase tracking-widest block">
                      CURRENT TOKEN CALLING
                    </span>
                    <div className="text-3xl font-bold text-teal-300 font-mono">
                      #{doctorForActiveToken?.currentTokenNumber || '104'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Patients Ahead</span>
                    <span className="text-xl font-bold text-amber-300">{patientsAhead}</span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Est. Waiting Time</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {myActiveToken.status === 'IN_CONSULTATION'
                        ? '0 mins'
                        : `${myActiveToken.estimatedWaitMinutes} mins`}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Queue Status</span>
                    <span className="text-sm font-bold text-purple-300 uppercase mt-1 block">
                      {myActiveToken.status}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block uppercase">Assigned Counter</span>
                    <span className="text-sm font-bold text-teal-300 mt-1 block">
                      {myActiveToken.counterNumber}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                  <p>
                    Department: <strong className="text-white">{myActiveToken.departmentName}</strong> | Doctor:{' '}
                    <strong className="text-white">{myActiveToken.doctorName}</strong>
                  </p>
                  <Button
                    variant="teal"
                    size="sm"
                    onClick={() => setActiveSubTab('navigation')}
                    className="flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Navigate to Counter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold">No active token issued currently.</p>
                <p className="text-xs text-slate-400 mt-1">Fill out the generator form below to issue a ticket.</p>
              </div>
            )}

            {/* Token Generator Form */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-600" /> Generate New Digital OPD Token
              </h3>

              <form onSubmit={handleIssueToken} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      const match = doctors.find((d) => d.departmentId === e.target.value);
                      if (match) setSelectedDocId(match.id);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.floor})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Consulting Doctor</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {doctors
                      .filter((d) => d.departmentId === selectedDeptId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Priority Desk</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="NORMAL">Normal OPD Queue</option>
                    <option value="SENIOR_CITIZEN">Senior Citizen Priority</option>
                    <option value="EMERGENCY">Emergency Priority Desk</option>
                    <option value="PREGNANT_OR_DISABLED">Pregnant / Disabled Access</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <Button type="submit" variant="teal" size="sm" disabled={isIssuingToken}>
                    {isIssuingToken ? 'Generating...' : 'Issue Digital Token Ticket'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MEDICAL RECORDS MODULE (HISTORY, PRESCRIPTIONS, LABS, PREVIOUS APTS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'records' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Personal Medical Records</h2>
                <p className="text-xs text-slate-500">Access clinical history, prescriptions, and diagnostic lab reports</p>
              </div>

              {/* Records Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setRecordsTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recordsTab === 'history' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Medical History
                </button>
                <button
                  onClick={() => setRecordsTab('prescriptions')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recordsTab === 'prescriptions' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Prescriptions
                </button>
                <button
                  onClick={() => setRecordsTab('labs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recordsTab === 'labs' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Lab Reports
                </button>
                <button
                  onClick={() => setRecordsTab('previous')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    recordsTab === 'previous' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Past Visits
                </button>
              </div>
            </div>

            {/* Sub-Tab 1: Medical History */}
            {recordsTab === 'history' && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicalRecords?.history.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">
                            Diagnosed: {item.diagnosedDate}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900">{item.condition}</h4>
                        </div>
                        <Badge variant={item.status === 'ACTIVE' ? 'warning' : 'success'}>
                          {item.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 mt-2">
                        <strong>Doctor:</strong> {item.treatingDoctor}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{item.notes}"
                      </p>

                      {item.allergies.length > 0 && (
                        <div className="mt-3 text-xs">
                          <span className="font-bold text-rose-700">Known Allergies: </span>
                          <span className="text-slate-700">{item.allergies.join(', ')}</span>
                        </div>
                      )}

                      {item.immunizations.length > 0 && (
                        <div className="mt-2 text-xs">
                          <span className="font-bold text-teal-700">Immunization History: </span>
                          <span className="text-slate-700">{item.immunizations.join(' | ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Prescriptions */}
            {recordsTab === 'prescriptions' && (
              <div className="space-y-4 pt-4">
                {medicalRecords?.prescriptions.map((rx) => (
                  <div key={rx.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-teal-600" />
                          <h4 className="text-sm font-extrabold text-slate-900">{rx.prescriptionNumber}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Issued by <strong>{rx.doctorName}</strong> ({rx.departmentName}) on {rx.date}
                        </p>
                      </div>
                      <Badge variant={rx.status === 'DISPENSED' ? 'success' : 'teal'}>{rx.status}</Badge>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Diagnosis:</strong> {rx.diagnosis}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Prescribed Medications ({rx.medicines.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {rx.medicines.map((m, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                            <span className="font-bold text-teal-800 block">{m.name}</span>
                            <span className="text-[11px] text-slate-600 block">Dosage: {m.dosage}</span>
                            <span className="text-[11px] text-slate-500 block">
                              Duration: {m.duration} | Instructions: {m.instructions}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-Tab 3: Lab Reports */}
            {recordsTab === 'labs' && (
              <div className="space-y-4 pt-4">
                {medicalRecords?.labReports.map((lab) => (
                  <div key={lab.id} className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <TestTube className="w-4 h-4 text-rose-600" />
                          <h4 className="text-sm font-extrabold text-slate-900">{lab.testName}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Report #{lab.reportNumber} | Ordered by {lab.orderedBy} on {lab.orderDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant={lab.status === 'COMPLETED' ? 'success' : 'warning'}>
                          {lab.status}
                        </Badge>
                        {lab.status === 'COMPLETED' && (
                          <Button variant="outline" size="sm" className="text-xs">
                            <Download className="w-3.5 h-3.5 mr-1" /> PDF Report
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Results Summary:</strong> {lab.resultsSummary}
                    </p>

                    {lab.metrics.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                          <thead className="bg-slate-100 text-slate-700 font-bold">
                            <tr>
                              <th className="p-2">Test Parameter</th>
                              <th className="p-2">Result Value</th>
                              <th className="p-2">Normal Range</th>
                              <th className="p-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {lab.metrics.map((m, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="p-2 font-medium">{m.parameter}</td>
                                <td className="p-2 font-bold text-slate-900">{m.result}</td>
                                <td className="p-2 text-slate-500">{m.normalRange}</td>
                                <td className="p-2">
                                  <Badge
                                    variant={
                                      m.status === 'NORMAL'
                                        ? 'success'
                                        : m.status === 'BORDERLINE'
                                        ? 'warning'
                                        : 'danger'
                                    }
                                  >
                                    {m.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sub-Tab 4: Previous Appointments */}
            {recordsTab === 'previous' && (
              <div className="space-y-3 pt-4">
                {medicalRecords?.previousAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        Completed Visit &bull; {apt.date}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-0.5">{apt.doctorName}</h4>
                      <p className="text-xs text-slate-600">{apt.departmentName}</p>
                      {apt.symptoms && <p className="text-[11px] text-slate-500 mt-1 italic">"{apt.symptoms}"</p>}
                    </div>
                    <Badge variant="success">Completed</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. HOSPITAL NAVIGATION & WAYFINDING MODULE */}
      {/* ========================================================================= */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Hospital Wayfinding & Navigation</h2>
                <p className="text-xs text-slate-500">Locate departments, laboratories, pharmacies, wards & emergency desks</p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search doctor, dept, ward, lab..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: 'All Places' },
                { key: 'OPD', label: 'Doctor / OPD' },
                { key: 'REGISTRATION', label: 'Registration Kiosk' },
                { key: 'LABORATORY', label: 'Laboratory' },
                { key: 'PHARMACY', label: 'Pharmacy' },
                { key: 'BILLING', label: 'Billing Desk' },
                { key: 'WARD', label: 'Ward' },
                { key: 'EMERGENCY', label: 'Emergency' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setNavCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    navCategory === cat.key
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Location Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredLocations.map((loc) => (
                <div key={loc.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">
                        {loc.category} &bull; {loc.floor} ({loc.wing})
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{loc.name}</h3>
                    </div>
                    <Badge variant={loc.category === 'EMERGENCY' ? 'danger' : 'teal'}>
                      {loc.openHours}
                    </Badge>
                  </div>

                  <div className="mt-3 bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider text-teal-800">
                      Step-by-Step Directions:
                    </span>
                    {loc.directionSteps.map((step, idx) => (
                      <p key={idx} className="flex items-start gap-1.5 text-slate-600">
                        <ChevronRight className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </p>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>Active Counters: <strong>{loc.activeCounters}</strong></span>
                    <span className="text-teal-700 font-bold">Avg Wait: {loc.queueWaitMins} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. NOTIFICATIONS MODULE */}
      {/* ========================================================================= */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Hospital Notifications & Alerts</h2>
                <p className="text-xs text-slate-500">Live alerts for appointments, token calls, doctor delays & lab reports</p>
              </div>

              {unreadNotifCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
                  <Check className="w-3.5 h-3.5 mr-1 text-teal-600" /> Mark All as Read
                </Button>
              )}
            </div>

            {/* Notification Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'ALL', label: 'All Alerts' },
                { key: 'APPOINTMENT', label: 'Appointment Reminders' },
                { key: 'TOKEN', label: 'Token Alerts' },
                { key: 'DOCTOR_DELAY', label: 'Doctor Delays' },
                { key: 'LAB_REPORT', label: 'Lab Reports' },
                { key: 'PHARMACY', label: 'Pharmacy Ready' },
                { key: 'BILLING', label: 'Billing Notifications' }
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setNotifCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    notifCategory === cat.key
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="space-y-3 pt-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">No notifications found for this category.</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      n.read
                        ? 'bg-slate-50/50 border-slate-200/80 text-slate-600'
                        : 'bg-white border-teal-300 shadow-sm text-slate-900 ring-1 ring-teal-500/20'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {!n.read && <span className="w-2 h-2 rounded-full bg-teal-500"></span>}
                        <h4 className="text-xs font-extrabold">{n.title}</h4>
                        <Badge
                          variant={
                            n.severity === 'SUCCESS'
                              ? 'success'
                              : n.severity === 'WARNING'
                              ? 'warning'
                              : n.severity === 'CRITICAL'
                              ? 'danger'
                              : 'teal'
                          }
                        >
                          {n.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{n.message}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">{n.timestamp}</span>
                    </div>

                    {!n.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkNotifRead(n.id)}
                        className="text-[11px] shrink-0"
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
