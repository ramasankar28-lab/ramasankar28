import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Users,
  Stethoscope,
  HeartPulse,
  Pill,
  CreditCard,
  MapPin,
  BellRing,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Ticket,
  ChevronRight,
  UserCheck,
  Sparkles,
  Activity,
  FileText,
  FlaskConical,
  Compass,
  ArrowUpRight,
  Play
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardContent } from '../ui/Card';

interface LandingPageProps {
  onNavigateTab: (tabId: string) => void;
  setUserRole: (role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN') => void;
}

export function LandingPageModule({ onNavigateTab, setUserRole }: LandingPageProps) {
  const [activePreviewNode, setActivePreviewNode] = useState<'queue' | 'doctor' | 'nurse' | 'pharmacy'>('queue');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLaunchRole = (role: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN', tabId: string) => {
    setUserRole(role);
    onNavigateTab(tabId);
  };

  const features = [
    {
      id: 'queue',
      icon: Clock,
      title: 'Smart Queue Management',
      desc: 'Digital token allocation bypasses registration lines with live position updates & automated chime alerts.',
      tag: 'OPD Flow',
      color: 'text-teal-600 bg-teal-50 border-teal-200'
    },
    {
      id: 'predict',
      icon: Activity,
      title: 'Waiting-Time Prediction',
      desc: 'Predictive algorithms calculate exact wait times based on doctor consultation pacing and room velocity.',
      tag: 'Live Estimation',
      color: 'text-sky-600 bg-sky-50 border-sky-200'
    },
    {
      id: 'appointments',
      icon: Stethoscope,
      title: 'Digital Appointments',
      desc: 'OPD booking with enforced doctor daily caps (25–30 max) ensuring 10–15 min dedicated consultation time.',
      tag: 'Burnout Shield',
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      id: 'navigation',
      icon: Compass,
      title: 'Hospital Navigation',
      desc: 'Floor-by-floor counter wayfinding guiding patients seamlessly from OPD to Labs, Pharmacy & Billing.',
      tag: 'Counter Locator',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
    },
    {
      id: 'pharmacy',
      icon: Pill,
      title: 'Smart Pharmacy',
      desc: 'Digital prescriptions stream directly from doctor rooms to dispense counters for instant pickup.',
      tag: 'Express Dispense',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      id: 'records',
      icon: FileText,
      title: 'Digital Records',
      desc: 'Centralized patient health records, historical visit telemetry, and digital billing history in one place.',
      tag: 'EHR Sync',
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      id: 'alerts',
      icon: BellRing,
      title: 'Real-Time Notifications',
      desc: 'Automated SMS, audio chime announcements, and critical nurse alerts for urgent vitals drops.',
      tag: 'Instant Alerts',
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: 'Hospital Analytics',
      desc: 'Real-time hospital capacity metrics, bed occupancy tracking, and OPD volume distribution insights.',
      tag: 'Command Center',
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    }
  ];

  const workflowSteps = [
    { num: '01', title: 'Registration', desc: 'Scan QR at kiosk or online portal', icon: UserCheck, dept: 'Counter #1' },
    { num: '02', title: 'Appointment', desc: 'Select department & doctor slot', icon: Stethoscope, dept: 'OPD Desk' },
    { num: '03', title: 'Token', desc: 'Receive digital token & live wait est.', icon: Ticket, dept: 'Smart Queue' },
    { num: '04', title: 'Consultation', desc: 'Doctor room callout via audio chime', icon: Building2, dept: 'OPD Room' },
    { num: '05', title: 'Laboratory', desc: 'Direct digital lab order routing', icon: FlaskConical, dept: 'Lab 2nd Floor' },
    { num: '06', title: 'Pharmacy', desc: 'Prescription ready at Counter #2', icon: Pill, dept: 'Pharmacy Hub' },
    { num: '07', title: 'Billing', desc: 'Cashless invoice payment & clearance', icon: CreditCard, dept: 'Accounts' },
    { num: '08', title: 'Completion', desc: 'Digital summary sent to mobile', icon: CheckCircle2, dept: 'Discharge' }
  ];

  const userRolesList = [
    {
      role: 'PATIENT' as const,
      title: 'Patient',
      icon: Users,
      tabId: 'queue',
      color: 'border-teal-500 text-teal-600 bg-teal-50',
      badge: 'Self-Service',
      desc: 'Book digital tokens from home or lobby kiosk, track live queue position, view wait countdowns, and follow turn-by-turn counter directions.'
    },
    {
      role: 'DOCTOR' as const,
      title: 'Doctor',
      icon: Stethoscope,
      tabId: 'doctors',
      color: 'border-sky-500 text-sky-600 bg-sky-50',
      badge: 'OPD Desk',
      desc: 'Call next token with one click, manage daily consultation caps (25-30 patients max), review patient vitals, and issue e-prescriptions.'
    },
    {
      role: 'NURSE' as const,
      title: 'Nurse',
      icon: HeartPulse,
      tabId: 'nurses',
      color: 'border-rose-500 text-rose-600 bg-rose-50',
      badge: 'Care Station',
      desc: 'Monitor real-time bed telemetry (Heart Rate, SpO2, BP), log vital signs digitally, and receive instant alarms for critical drops.'
    },
    {
      role: 'PATIENT' as const,
      title: 'Patient Attender',
      icon: Compass,
      tabId: 'navigation',
      color: 'border-emerald-500 text-emerald-600 bg-emerald-50',
      badge: 'Wayfinding',
      desc: 'Navigate multi-floor counter locations with step-by-step guidance to avoid lost attendants between pharmacy, billing, and lab counters.'
    },
    {
      role: 'ADMIN' as const,
      title: 'Pharmacy',
      icon: Pill,
      tabId: 'pharmacy',
      color: 'border-indigo-500 text-indigo-600 bg-indigo-50',
      badge: 'Dispense Desk',
      desc: 'View incoming doctor prescriptions in real time, update medicine preparation status (Preparing -> Ready), and process instant dispense.'
    },
    {
      role: 'ADMIN' as const,
      title: 'Admin',
      icon: BarChart3,
      tabId: 'overview',
      color: 'border-amber-500 text-amber-600 bg-amber-50',
      badge: 'Command Center',
      desc: 'Monitor hospital-wide bed occupancy, track active queue bottlenecks, review staff load factor analytics, and broadcast urgent alerts.'
    }
  ];

  return (
    <div className="space-y-16 pb-12 antialiased">
      {/* HERO SECTION */}
      <section className="relative rounded-3xl bg-slate-900 text-white overflow-hidden border border-slate-800 shadow-xl">
        {/* Subtle Background Glow Elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 sm:px-10 lg:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content Left */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-teal-400 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>Community Service Healthcare Project</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] text-white">
              Smarter Hospital.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-sky-300 to-teal-200">
                Faster Care.
              </span><br />
              Better Connectivity.
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              Connecting patients, doctors, nurses, attendants and pharmacy teams through one intelligent hospital platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="teal"
                size="lg"
                onClick={() => onNavigateTab('queue')}
                className="font-black text-sm uppercase tracking-wider py-3.5 px-8 shadow-lg shadow-teal-500/20 flex items-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => scrollToSection('features')}
                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-sm font-bold uppercase tracking-wider py-3.5 px-7"
              >
                Explore Features
              </Button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-xl sm:text-2xl font-black text-teal-400">14 min</div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Avg Wait Time</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-sky-400">64%</div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Queue Time Saved</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">100%</div>
                <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Real-Time Sync</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Right: Modern Hospital Dashboard Preview */}
          <div className="lg:col-span-5 relative">
            <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-4 shadow-2xl relative overflow-hidden backdrop-blur-md">
              {/* Preview Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-bold text-slate-400 font-mono">
                    Node-01 // Connectivity Matrix
                  </span>
                </div>
                <Badge variant="success" className="text-[10px] px-2 py-0">
                  LIVE 2.4
                </Badge>
              </div>

              {/* Node Toggle Control */}
              <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl mb-3 border border-slate-800">
                {(['queue', 'doctor', 'nurse', 'pharmacy'] as const).map((node) => (
                  <button
                    key={node}
                    onClick={() => setActivePreviewNode(node)}
                    className={`py-1.5 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all ${
                      activePreviewNode === node
                        ? 'bg-teal-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {node}
                  </button>
                ))}
              </div>

              {/* Dynamic Preview Content */}
              <div className="space-y-3">
                {activePreviewNode === 'queue' && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Patient Queue</span>
                      <span className="text-teal-400 font-mono font-bold">#C-402</span>
                    </div>
                    <div className="text-2xl font-black text-white">
                      Cardiology OPD <span className="text-teal-400 text-sm font-normal">Pos #2</span>
                    </div>
                    <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-2 text-xs text-teal-300 flex justify-between items-center">
                      <span>Predicted Wait Time:</span>
                      <span className="font-extrabold text-white">~12 Mins</span>
                    </div>
                  </div>
                )}

                {activePreviewNode === 'doctor' && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Doctor Consultation</span>
                      <span className="text-sky-400 font-mono font-bold">Room 102</span>
                    </div>
                    <div className="text-sm font-bold text-white">Dr. Ananya Sharma (Cardiology)</div>
                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-2 text-xs text-sky-300 flex justify-between items-center">
                      <span>Active Consultation:</span>
                      <span className="font-mono font-bold text-white">08:30 min / 15:00</span>
                    </div>
                  </div>
                )}

                {activePreviewNode === 'nurse' && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Nurse Telemetry</span>
                      <span className="text-rose-400 font-bold">Station Alpha</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">SpO2</div>
                        <div className="text-emerald-400 font-black text-sm">98%</div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Pulse</div>
                        <div className="text-rose-400 font-black text-sm">72 bpm</div>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">BP</div>
                        <div className="text-sky-400 font-black text-sm">120/80</div>
                      </div>
                    </div>
                  </div>
                )}

                {activePreviewNode === 'pharmacy' && (
                  <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase">Smart Pharmacy</span>
                      <span className="text-indigo-400 font-mono font-bold">Counter #2</span>
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">Prescription #Rx-8821 Ready</div>
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-2 text-xs text-indigo-300 flex justify-between items-center">
                      <span>Dispense Status:</span>
                      <span className="font-bold text-emerald-400">Ready for Pick-Up</span>
                    </div>
                  </div>
                )}

                {/* Key Connectivity Matrix Nodes */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-2">
                    <Ticket className="h-3.5 w-3.5 text-teal-400" />
                    <span>Digital Token Sync</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-slate-300 flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-sky-400" />
                    <span>Wait Prediction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 lg:p-12 border border-slate-800 relative overflow-hidden shadow-lg">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
          <Badge variant="danger" className="text-xs px-3 py-1 uppercase tracking-wider">
            Operational Challenge
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            The Healthcare Bottleneck Problem
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
            &ldquo;Overcrowded hospitals create long queues, unpredictable waiting times, communication gaps and unnecessary movement between departments.&rdquo;
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-rose-400">110 mins</div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Traditional Wait Time</div>
            <p className="text-[11px] text-slate-400">Unmanaged counter queues cause severe congestion</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-teal-400">22 mins</div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Smart Connectivity Wait</div>
            <p className="text-[11px] text-slate-400">Real-time token pacing & wait prediction</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-sky-400">0 Lost</div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attendant Wayfinding</div>
            <p className="text-[11px] text-slate-400">Direct floor-by-floor counter directions</p>
          </div>

          <div className="bg-slate-800/80 rounded-2xl p-6 border border-slate-700/60 text-center space-y-2">
            <div className="text-3xl sm:text-4xl font-black text-amber-400">100%</div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Staff Sync Accuracy</div>
            <p className="text-[11px] text-slate-400">Instant doctor-nurse-pharmacy data flow</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="info" className="text-xs uppercase tracking-wider">
            Intelligent Platform Capabilities
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Comprehensive Connectivity Features
          </h2>
          <p className="text-slate-600 text-sm">
            Engineered to streamline every stage of patient care, OPD workflow, and hospital resource management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card
                key={f.id}
                className="hover:border-slate-400 transition-all cursor-pointer group shadow-xs hover:shadow-md"
                onClick={() => onNavigateTab(f.id === 'queue' || f.id === 'predict' ? 'queue' : f.id === 'navigation' ? 'navigation' : f.id === 'pharmacy' ? 'pharmacy' : 'overview')}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${f.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">
                      {f.tag}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-xs font-bold text-teal-600 group-hover:translate-x-1 transition-transform">
                    <span>Explore Module</span>
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-sm space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="purple" className="text-xs uppercase tracking-wider">
            Patient Journey Flow
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How It Works
          </h2>
          <p className="text-slate-600 text-sm">
            End-to-end synchronized workflow from initial registration to final billing completion.
          </p>
        </div>

        {/* Stepper Flow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 relative hover:bg-slate-100/80 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-teal-600 font-mono">{step.num}</span>
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  <p className="text-xs text-slate-600 mt-1">{step.desc}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 uppercase font-bold">Node:</span>
                  <span className="font-extrabold text-slate-800">{step.dept}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* USER ROLES SECTION */}
      <section id="user-roles" className="space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="success" className="text-xs uppercase tracking-wider">
            Role-Based Consoles
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tailored User Roles
          </h2>
          <p className="text-slate-600 text-sm">
            Dedicated interfaces designed specifically for every stakeholder in the hospital ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userRolesList.map((r, idx) => {
            const Icon = r.icon;
            return (
              <Card
                key={idx}
                className="p-6 rounded-3xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${r.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="default" className="text-[10px] font-bold uppercase tracking-wider">
                      {r.badge}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{r.title}</h3>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLaunchRole(r.role, r.tabId)}
                    className="w-full font-bold uppercase tracking-wider text-xs justify-between"
                  >
                    <span>Launch {r.title} Desk</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-300 rounded-3xl p-8 lg:p-12 border border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-md shadow-teal-500/20">
              +
            </div>
            <div>
              <span className="text-xl font-bold text-white tracking-tight block">
                Smart Hospital Connectivity
              </span>
              <span className="text-xs text-teal-400 font-semibold block">
                Community Service Healthcare Technology Project
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="teal"
              size="sm"
              onClick={() => onNavigateTab('queue')}
            >
              Open Live OPD Board
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigateTab('overview')}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            >
              Analytics Dashboard
            </Button>
          </div>
        </div>

        {/* Navigation Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-xs">
          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Platform</div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => onNavigateTab('landing')} className="hover:text-teal-400 transition-colors">
                  Home Landing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('overview')} className="hover:text-teal-400 transition-colors">
                  Live Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('queue')} className="hover:text-teal-400 transition-colors">
                  Patient Queues
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Services</div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => onNavigateTab('doctors')} className="hover:text-teal-400 transition-colors">
                  OPD Schedule
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('nurses')} className="hover:text-teal-400 transition-colors">
                  Nurse Station
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('pharmacy')} className="hover:text-teal-400 transition-colors">
                  Pharmacy Hub
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Wayfinding</div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => onNavigateTab('navigation')} className="hover:text-teal-400 transition-colors">
                  Counter Locator
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateTab('navigation')} className="hover:text-teal-400 transition-colors">
                  Floor Directory
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Roles</div>
            <ul className="space-y-2 text-slate-300">
              <li>
                <button onClick={() => handleLaunchRole('PATIENT', 'queue')} className="hover:text-teal-400 transition-colors">
                  Patient Portal
                </button>
              </li>
              <li>
                <button onClick={() => handleLaunchRole('DOCTOR', 'doctors')} className="hover:text-teal-400 transition-colors">
                  Doctor Desk
                </button>
              </li>
              <li>
                <button onClick={() => handleLaunchRole('NURSE', 'nurses')} className="hover:text-teal-400 transition-colors">
                  Nurse Care
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Emergency</div>
            <ul className="space-y-2 text-slate-300">
              <li className="text-rose-400 font-bold">Helpline: 108</li>
              <li>OPD: 08:00 AM - 08:00 PM</li>
            </ul>
          </div>

          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider mb-3">Project</div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Designed as a community service healthcare technology initiative to eliminate overcrowding & care delays.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>&copy; 2026 Smart Hospital Connectivity Platform &bull; Community Service Healthcare Project</span>
          <span className="flex items-center text-teal-400 font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> All Systems Active & Synchronized
          </span>
        </div>
      </footer>
    </div>
  );
}
