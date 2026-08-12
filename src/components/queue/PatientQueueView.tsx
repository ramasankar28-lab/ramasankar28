import React, { useState, useEffect } from 'react';
import { SmartQueueItem, QueueDepartment } from '../../types';
import { QueuePriorityBadge } from './QueuePriorityBadge';
import { QueueStatusBadge } from './QueueStatusBadge';
import { QueueDataCard } from './QueueDataCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Clock,
  UserCheck,
  Building2,
  Volume2,
  BellRing,
  AlertCircle,
  Search,
  Sparkles,
  CheckCircle2,
  Phone
} from 'lucide-react';

interface PatientQueueViewProps {
  queueItems: SmartQueueItem[];
  onRefresh: () => void;
  currentUserMrn?: string;
  currentUserName?: string;
}

export function PatientQueueView({
  queueItems,
  onRefresh,
  currentUserMrn = 'MRN-2026-8812',
  currentUserName = 'David Miller'
}: PatientQueueViewProps) {
  const [selectedDept, setSelectedDept] = useState<QueueDepartment>('General OPD');
  const [selectedTokenNumber, setSelectedTokenNumber] = useState<string>('');
  const [chimeBanner, setChimeBanner] = useState<string | null>(null);

  const departments: QueueDepartment[] = [
    'Registration',
    'General OPD',
    'Specialist OPD',
    'Laboratory',
    'Pharmacy',
    'Billing'
  ];

  // Filter items by department
  const deptItems = queueItems.filter((q) => q.department === selectedDept);

  // Find currently serving / calling token in this department
  const currentlyServing = deptItems.find(
    (q) => q.status === 'CALLING' || q.status === 'IN_SERVICE' || q.status === 'EMERGENCY'
  );

  // Patient's own active token (or searched token)
  const myTokenItem =
    deptItems.find(
      (q) =>
        (selectedTokenNumber && q.tokenNumber.toLowerCase() === selectedTokenNumber.toLowerCase()) ||
        q.mrn === currentUserMrn ||
        q.patientName.toLowerCase().includes(currentUserName.toLowerCase())
    ) || deptItems[0];

  // Calculate patients ahead for myTokenItem
  const patientsAhead = deptItems.filter((q) => {
    if (q.id === myTokenItem?.id) return false;
    if (q.status === 'COMPLETED' || q.status === 'SKIPPED') return false;
    return q.queuePosition < (myTokenItem?.queuePosition || 99);
  }).length;

  // Real-time notification check if 'myTokenItem' was just called
  useEffect(() => {
    if (myTokenItem && (myTokenItem.status === 'CALLING' || myTokenItem.status === 'EMERGENCY')) {
      const bannerText = `ALERT: Token #${myTokenItem.tokenNumber} (${myTokenItem.patientName}) is CALLED at ${myTokenItem.department} - ${myTokenItem.counterNumber || 'Main Counter'}!`;
      setChimeBanner(bannerText);

      // Web Audio synth chime sound simulation
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch (e) {
        // Audio fallback
      }
    } else {
      setChimeBanner(null);
    }
  }, [myTokenItem?.status, myTokenItem?.tokenNumber]);

  return (
    <div className="space-y-6">
      {/* Live Audio Call Alert Banner */}
      {chimeBanner && (
        <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-teal-700 text-white p-4 rounded-xl shadow-lg border-2 border-sky-300 animate-bounce flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-full animate-pulse">
              <Volume2 className="h-6 w-6 text-yellow-300" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-sky-200 block">
                Live Announcement
              </span>
              <p className="text-sm font-bold">{chimeBanner}</p>
            </div>
          </div>
          <Badge variant="warning" className="text-xs px-2.5 py-1 font-mono">
            PROCEED IMMEDIATELY
          </Badge>
        </div>
      )}

      {/* Department Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto flex space-x-1.5 scrollbar-none">
        {departments.map((dept) => {
          const count = queueItems.filter(
            (q) => q.department === dept && (q.status === 'WAITING' || q.status === 'CALLING' || q.status === 'IN_SERVICE')
          ).length;
          const isSelected = selectedDept === dept;

          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-2 ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>{dept}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Patient Live Queue Display Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Your Token & Live Patients Ahead Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Display Box: Required 6 Patient View Indicators */}
          <Card className="border-sky-200 shadow-sm bg-gradient-to-br from-white via-sky-50/30 to-teal-50/20 overflow-hidden relative">
            <CardHeader className="border-b border-slate-100 p-5 bg-white/80">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-sky-700 uppercase tracking-wider block">
                    Patient Live Token Display
                  </span>
                  <CardTitle className="text-lg font-black text-slate-900">
                    {selectedDept} Queue Tracker
                  </CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Live Sync
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Token Display Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. CURRENT TOKEN BEING SERVED */}
                <div className="bg-white p-5 rounded-xl border border-sky-200 shadow-2xs text-center relative">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Current Serving Token
                  </span>
                  <div className="text-3xl font-black text-sky-700 font-mono my-1">
                    {currentlyServing ? `#${currentlyServing.tokenNumber}` : 'NONE'}
                  </div>
                  {currentlyServing ? (
                    <div className="text-xs text-slate-600 font-medium">
                      Counter: <strong className="text-slate-900">{currentlyServing.counterNumber || 'Desk #1'}</strong>
                      <br />
                      Provider: <span className="text-sky-800">{currentlyServing.serviceProvider}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">All tokens cleared</span>
                  )}
                </div>

                {/* 2. YOUR TOKEN */}
                <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white p-5 rounded-xl shadow-md text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <Sparkles className="h-4 w-4 text-teal-300" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-sky-200 tracking-wider block">
                    Your Assigned Token
                  </span>
                  <div className="text-3xl font-black text-teal-300 font-mono my-1">
                    {myTokenItem ? `#${myTokenItem.tokenNumber}` : 'NO TOKEN'}
                  </div>
                  {myTokenItem ? (
                    <div className="text-xs text-sky-100">
                      Patient: <strong className="text-white">{myTokenItem.patientName}</strong> ({myTokenItem.mrn})
                    </div>
                  ) : (
                    <span className="text-xs text-sky-300">Issue token to view live position</span>
                  )}
                </div>
              </div>

              {/* 3. PATIENTS AHEAD, ESTIMATED WAIT, QUEUE POSITION, QUEUE STATUS */}
              {myTokenItem && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                  {/* Patients Ahead */}
                  <div className="p-2.5 bg-slate-50 rounded-lg text-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Patients Ahead
                    </span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {patientsAhead}
                    </span>
                    <span className="text-[10px] text-slate-500 block">in queue</span>
                  </div>

                  {/* Estimated Waiting Time */}
                  <div className="p-2.5 bg-sky-50 rounded-lg text-center border border-sky-100">
                    <span className="text-[10px] font-bold uppercase text-sky-700 block">
                      Est. Wait Time
                    </span>
                    <span className="text-2xl font-black text-sky-900 font-mono">
                      {myTokenItem.estimatedWaitMinutes} <span className="text-xs font-sans">mins</span>
                    </span>
                    <span className="text-[10px] text-sky-600 block">calculated live</span>
                  </div>

                  {/* Queue Position */}
                  <div className="p-2.5 bg-teal-50 rounded-lg text-center border border-teal-100">
                    <span className="text-[10px] font-bold uppercase text-teal-800 block">
                      Queue Position
                    </span>
                    <span className="text-2xl font-black text-teal-950 font-mono">
                      #{myTokenItem.queuePosition}
                    </span>
                    <span className="text-[10px] text-teal-700 block">in line</span>
                  </div>

                  {/* Queue Status */}
                  <div className="p-2.5 bg-slate-50 rounded-lg text-center flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Queue Status
                    </span>
                    <QueueStatusBadge status={myTokenItem.status} />
                  </div>
                </div>
              )}

              {/* Active Token Details Card */}
              {myTokenItem && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Complete Token Metadata
                  </h4>
                  <QueueDataCard item={myTokenItem} isStaffView={false} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Search Token & Department All Queue Line */}
        <div className="space-y-6">
          {/* Quick Token Search / Switcher */}
          <Card className="shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center">
                <Search className="h-4 w-4 mr-1.5 text-sky-600" />
                Track Specific Token
              </CardTitle>
              <CardDescription className="text-xs">
                Enter token number (e.g. OPD-201, REG-101) to view status
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="e.g. OPD-201 or David"
                  value={selectedTokenNumber}
                  onChange={(e) => setSelectedTokenNumber(e.target.value)}
                  className="flex-1 rounded-lg border border-slate-300 p-2 text-xs font-mono font-bold focus:ring-2 focus:ring-sky-500"
                />
                <Button variant="outline" size="sm" onClick={() => setSelectedTokenNumber('')}>
                  Clear
                </Button>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="flex justify-between">
                  <span>Tracking MRN:</span>
                  <span className="font-mono font-bold text-slate-800">{currentUserMrn}</span>
                </div>
                <div className="flex justify-between">
                  <span>Patient Name:</span>
                  <span className="font-bold text-slate-800">{currentUserName}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Department Queue List */}
          <Card className="shadow-2xs">
            <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  {selectedDept} Queue Line
                </CardTitle>
                <CardDescription className="text-xs">
                  {deptItems.length} patient(s) in department line
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5 max-h-[500px] overflow-y-auto">
              {deptItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No active tokens in this department queue.
                </div>
              ) : (
                deptItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      item.id === myTokenItem?.id
                        ? 'bg-sky-50 border-sky-300 shadow-2xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          #{item.tokenNumber}
                        </span>
                        <QueuePriorityBadge priority={item.priority} />
                      </div>
                      <QueueStatusBadge status={item.status} />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-slate-600 text-[11px]">
                      <span>{item.patientName}</span>
                      <span className="font-mono">{item.arrivalTime}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
