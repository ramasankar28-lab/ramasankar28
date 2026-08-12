import { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  HeartPulse,
  BedDouble,
  Zap,
  TrendingDown,
  CheckCircle2,
  Ticket,
  Search,
  ChevronRight,
  ShieldCheck,
  Building2,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { HospitalStats, Department, Doctor, QueueToken } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import { QuickTokenModal } from '../ui/QuickTokenModal';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface OverviewProps {
  onNavigateTab: (tabId: string) => void;
}

const queueComparisonData = [
  { time: '08:00 AM', manualWaitMins: 45, smartWaitMins: 12 },
  { time: '09:00 AM', manualWaitMins: 75, smartWaitMins: 18 },
  { time: '10:00 AM', manualWaitMins: 110, smartWaitMins: 22 },
  { time: '11:00 AM', manualWaitMins: 125, smartWaitMins: 25 },
  { time: '12:00 PM', manualWaitMins: 95, smartWaitMins: 20 },
  { time: '01:00 PM', manualWaitMins: 60, smartWaitMins: 15 },
  { time: '02:00 PM', manualWaitMins: 85, smartWaitMins: 16 },
  { time: '03:00 PM', manualWaitMins: 70, smartWaitMins: 14 },
];

const departmentTrafficData = [
  { name: 'General OPD', patients: 84, wait: 12 },
  { name: 'Cardiology', patients: 42, wait: 20 },
  { name: 'Pediatrics', patients: 38, wait: 10 },
  { name: 'Orthopedics', patients: 51, wait: 18 },
  { name: 'Dermatology', patients: 29, wait: 15 },
  { name: 'ENT Care', patients: 34, wait: 14 },
];

export function OverviewDashboardModule({ onNavigateTab }: OverviewProps) {
  const [stats, setStats] = useState<HospitalStats | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [liveTokens, setLiveTokens] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [s, d, doc, tok] = await Promise.all([
        hospitalService.getStats(),
        hospitalService.getDepartments(),
        hospitalService.getDoctors(),
        hospitalService.getTokens()
      ]);
      setStats(s);
      setDepartments(d);
      setDoctors(doc);
      setLiveTokens(tok);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const problemsSolved = [
    {
      title: 'OPD Queue Reduction',
      desc: 'Digital tokens & estimated wait predictions eliminate token desk congestion.',
      stat: '64% Faster',
      badge: 'Resolved'
    },
    {
      title: 'Doctor Load Balancing',
      desc: 'Token caps and consultation pacing prevent doctor burnout and short consultations.',
      stat: '30 Max/Doc',
      badge: 'Active'
    },
    {
      title: 'Patient Continuous Monitoring',
      desc: 'Automated vitals sync feeds alerts to nurses before critical deterioration.',
      stat: 'Live Vitals',
      badge: 'Active'
    },
    {
      title: 'Counter Wayfinding',
      desc: 'Clear step-by-step counter guidance for Pharmacy, Billing, and Labs.',
      stat: '0 Lost Attendants',
      badge: 'Resolved'
    }
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 flex items-center justify-center space-x-2">
        <Clock className="h-5 w-5 animate-spin text-sky-600" />
        <span>Loading Smart Hospital Connectivity analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-teal-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-sky-700/50 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-semibold text-sky-200">
              <Building2 className="h-3.5 w-3.5 text-teal-300" />
              <span>Community Service Healthcare Technology Initiative</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Smart Hospital Connectivity Platform
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
              Eliminating overcrowded OPDs, unmanaged registration queues, and delayed care through real-time queue orchestration, continuous nurse monitoring, and smart counter wayfinding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="teal"
              size="lg"
              onClick={() => setTokenModalOpen(true)}
              className="font-bold shadow-md shadow-teal-900/40"
            >
              <Ticket className="h-5 w-5 mr-2" />
              Issue Digital Token
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigateTab('queue')}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              View Live Queue Board
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Hospital KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-sky-100 bg-gradient-to-br from-white to-sky-50/30">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Patients Today
              </p>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.totalPatientsToday}
              </div>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center mt-0.5">
                <TrendingDown className="h-3 w-3 mr-1" />
                64% Queue Time Saved
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active OPD Queue
              </p>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.activeOPDQueue} Patients
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Avg Wait: <span className="text-amber-700 font-bold">~{stats?.avgWaitTimeMins} mins</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-100 bg-gradient-to-br from-white to-rose-50/30">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Critical Vitals Alert
              </p>
              <div className="text-2xl font-black text-rose-700 tracking-tight">
                {stats?.criticalAlerts} Active
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Nurse Station Notified
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
          <CardContent className="p-4 flex items-center space-x-3">
            <div className="h-12 w-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Bed Occupancy Rate
              </p>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {stats?.bedsOccupancyRate}%
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {stats?.nursesOnShift} Nurses on Duty
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wait Time Impact Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-slate-900">
                  <Zap className="h-4 w-4 mr-2 text-amber-500" />
                  OPD Waiting Time Reduction (Minutes)
                </CardTitle>
                <CardDescription>
                  Comparison between Traditional Unmanaged Queues vs. Smart Connectivity Token Engine
                </CardDescription>
              </div>
              <Badge variant="success">64% Reduction</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={queueComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSmart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#cbd5e1',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Area
                    type="monotone"
                    dataKey="manualWaitMins"
                    name="Traditional Queue Wait (Mins)"
                    stroke="#f43f5e"
                    fillOpacity={1}
                    fill="url(#colorManual)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="smartWaitMins"
                    name="Smart Connectivity Wait (Mins)"
                    stroke="#0d9488"
                    fillOpacity={1}
                    fill="url(#colorSmart)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live OPD Department Load */}
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">OPD Department Traffic</CardTitle>
            <CardDescription>Active patient distribution & average wait</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentTrafficData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10, fill: '#334155' }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                  <Bar dataKey="patients" name="Patients Queued" fill="#0284c7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>Overall Average Consultation:</span>
              <span className="font-bold text-slate-900">10 mins / patient</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core Problems Addressed Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Target Problems Addressed & Solved</h3>
            <p className="text-xs text-slate-500">Key operational solutions engineered into this platform</p>
          </div>
          <Badge variant="purple">Community Impact Project</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {problemsSolved.map((p, idx) => (
            <Card key={idx} className="hover:border-sky-300 transition-all">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="success" className="text-[10px]">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {p.badge}
                  </Badge>
                  <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                    {p.stat}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Live Active Token Ticker Bar */}
      <Card className="border-sky-200 bg-sky-50/50">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-900">
                Live Token Queue Board Status
              </div>
              <div className="text-xs text-slate-600">
                {liveTokens.filter((t) => t.status === 'IN_CONSULTATION').length} Currently in Doctor Rooms |{' '}
                {liveTokens.filter((t) => t.status === 'WAITING').length} Patients Waiting
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onNavigateTab('queue')}>
              Open Live OPD Board
            </Button>
            <Button variant="teal" size="sm" onClick={() => onNavigateTab('navigation')}>
              Open Counter Wayfinding <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <QuickTokenModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        departments={departments}
        doctors={doctors}
        onTokenIssued={loadData}
      />
    </div>
  );
}
