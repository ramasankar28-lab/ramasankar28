import React, { useState, useEffect } from 'react';
import {
  Clock,
  Ticket,
  UserCheck,
  Phone,
  AlertTriangle,
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  Filter,
  Search,
  Building2,
  Sparkles
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { QueueToken, Department, Doctor, TokenStatus, PriorityLevel } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import { getPriorityBadge, formatWaitTime, getStatusColor } from '../../lib/utils';
import { QuickTokenModal } from '../ui/QuickTokenModal';

interface LiveQueueModuleProps {
  userRole: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN';
}

export function LiveQueueModule({ userRole }: LiveQueueModuleProps) {
  const [tokens, setTokens] = useState<QueueToken[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [tokenModalOpen, setTokenModalOpen] = useState<boolean>(false);
  const [chimeAudioText, setChimeAudioText] = useState<string | null>(null);

  const fetchQueueData = async () => {
    try {
      const [toks, depts, docs] = await Promise.all([
        hospitalService.getTokens(selectedDocId || undefined),
        hospitalService.getDepartments(),
        hospitalService.getDoctors()
      ]);
      setTokens(toks);
      setDepartments(depts);
      setDoctors(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000);
    return () => clearInterval(interval);
  }, [selectedDocId, selectedDeptId]);

  const handleUpdateStatus = async (tokenId: string, status: TokenStatus, counter?: string) => {
    try {
      const updated = await hospitalService.updateTokenStatus(tokenId, status, counter);
      if (status === 'IN_CONSULTATION') {
        // Trigger announcement chime toast
        setChimeAudioText(`Token ${updated.tokenNumber} please proceed to ${updated.counterNumber}`);
        setTimeout(() => setChimeAudioText(null), 6000);
      }
      await fetchQueueData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTokens = tokens.filter((t) => {
    const matchesDept = !selectedDeptId || t.departmentId === selectedDeptId;
    const matchesDoc = !selectedDocId || t.doctorId === selectedDocId;
    const matchesQuery =
      !searchQuery ||
      t.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesDoc && matchesQuery;
  });

  const currentlyConsulting = filteredTokens.filter((t) => t.status === 'IN_CONSULTATION');
  const waitingInQueue = filteredTokens.filter((t) => t.status === 'WAITING');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Token Issue */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Live OPD Token Queue & Call Desk
            </h2>
            <Badge variant="success" className="animate-pulse">
              Syncing Live
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time display of active tokens, estimated wait times, and room call controls.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            variant="teal"
            onClick={() => setTokenModalOpen(true)}
            className="w-full sm:w-auto shadow-md"
          >
            <Ticket className="h-4 w-4 mr-2" />
            + Issue Digital Token
          </Button>
        </div>
      </div>

      {/* Audio Announcement Toast Simulation */}
      {chimeAudioText && (
        <div className="bg-gradient-to-r from-sky-900 via-teal-900 to-sky-900 text-white p-4 rounded-xl shadow-lg border border-teal-400/30 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-teal-500/30 flex items-center justify-center text-teal-300 shrink-0">
              <Volume2 className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Hospital Public Chime Announcement
              </div>
              <div className="text-sm font-extrabold text-white">{chimeAudioText}</div>
            </div>
          </div>
          <Badge variant="warning" className="bg-amber-400 text-slate-900 font-bold">
            Calling Now
          </Badge>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="bg-slate-50/70 border-slate-200">
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Filter by OPD Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedDocId('');
              }}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Departments ({departments.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Filter by Doctor
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Active Doctors</option>
              {doctors
                .filter((d) => !selectedDeptId || d.departmentId === selectedDeptId)
                .map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.roomNumber})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Search Patient / MRN / Token
            </label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search token #, MRN, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currently In Doctor Rooms Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-emerald-600" />
            Currently In Consultation Rooms ({currentlyConsulting.length})
          </h3>
          <span className="text-xs text-slate-500">Active OPD Consultations</span>
        </div>

        {currentlyConsulting.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
            No active consultation at this moment. Call next waiting token below.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentlyConsulting.map((token) => (
              <Card
                key={token.id}
                className="border-2 border-emerald-500/80 bg-gradient-to-br from-white to-emerald-50/20 shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg uppercase">
                  Inside Room
                </div>

                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-500">Token Number</span>
                      <div className="text-3xl font-black text-emerald-800 tracking-tight">
                        {token.tokenNumber}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500">Assigned Counter</span>
                      <div className="text-sm font-extrabold text-slate-900">
                        {token.counterNumber}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-slate-700">
                      <span className="font-semibold">Patient Name:</span>
                      <span className="font-bold">{token.patientName}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Medical Record #:</span>
                      <span className="font-mono">{token.mrn}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Doctor:</span>
                      <span className="font-medium">{token.doctorName}</span>
                    </div>
                  </div>

                  {/* Doctor/Nurse Action Controls */}
                  {(userRole === 'DOCTOR' || userRole === 'NURSE' || userRole === 'ADMIN') && (
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => handleUpdateStatus(token.id, 'COMPLETED')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Complete Consultation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Waiting Tokens Queue List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-sky-600" />
              Waiting Patient Queue ({waitingInQueue.length})
            </h3>
            <p className="text-xs text-slate-500">Ordered by priority and registration timestamp</p>
          </div>
          <Badge variant="info">Automated Wait Time Algorithm</Badge>
        </div>

        {waitingInQueue.length === 0 ? (
          <Card className="p-8 text-center text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Queue Clear!</p>
            <p className="text-xs text-slate-400">There are no waiting patients for the selected filter.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {waitingInQueue.map((token, idx) => {
              const priorityInfo = getPriorityBadge(token.priority);
              return (
                <Card
                  key={token.id}
                  className="hover:border-sky-300 transition-all border-slate-200/90 shadow-2xs"
                >
                  <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Token Number & Queue Rank */}
                    <div className="flex items-center space-x-4 shrink-0">
                      <div className="text-center bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 min-w-[80px]">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                          Token #
                        </span>
                        <span className="text-xl font-extrabold text-sky-900">
                          {token.tokenNumber}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-slate-900">{token.patientName}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priorityInfo.className}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {token.departmentName} &bull; {token.doctorName} ({token.counterNumber})
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          MRN: <span className="font-mono text-slate-600">{token.mrn}</span> &bull; Issued at {token.issueTime}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Estimated Wait Time Counter */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center px-4">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase">
                        Estimated Wait Time
                      </div>
                      <div className="text-base font-extrabold text-amber-700">
                        {formatWaitTime(token.estimatedWaitMinutes)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Position #{idx + 1} in line
                      </div>
                    </div>

                    {/* Right: Actions for Doctors/Staff or Patient tracking */}
                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                      {(userRole === 'DOCTOR' || userRole === 'NURSE' || userRole === 'ADMIN') ? (
                        <>
                          <Button
                            variant="teal"
                            size="sm"
                            onClick={() => handleUpdateStatus(token.id, 'IN_CONSULTATION', token.counterNumber)}
                          >
                            <Play className="h-3.5 w-3.5 mr-1" />
                            Call to Room
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(token.id, 'SKIPPED')}
                            className="text-slate-600"
                          >
                            Skip
                          </Button>
                        </>
                      ) : (
                        <div className="text-right">
                          <Badge variant="info">Live Tracking</Badge>
                          <p className="text-[10px] text-slate-400 mt-1">Screen auto-refreshes</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <QuickTokenModal
        isOpen={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        departments={departments}
        doctors={doctors}
        onTokenIssued={fetchQueueData}
      />
    </div>
  );
}
