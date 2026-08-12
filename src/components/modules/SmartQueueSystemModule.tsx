import React, { useState, useEffect } from 'react';
import { SmartQueueItem, QueueDepartment, QueueItemPriority } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import { PatientQueueView } from '../queue/PatientQueueView';
import { StaffQueueView } from '../queue/StaffQueueView';
import { DepartmentSummaryCard } from '../queue/DepartmentSummaryCard';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Users,
  Clock,
  Volume2,
  Building2,
  UserCheck,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft
} from 'lucide-react';

export function SmartQueueSystemModule() {
  const [activeView, setActiveView] = useState<'patient' | 'staff'>('patient');
  const [selectedDept, setSelectedDept] = useState<QueueDepartment>('General OPD');
  const [queueItems, setQueueItems] = useState<SmartQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await hospitalService.getSmartQueue();
      setQueueItems(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load queue dataset');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Auto-polling interval for real-time queue synchronization
    const interval = setInterval(fetchQueueData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Staff Handlers
  const handleCallNext = async (id?: string, dept?: QueueDepartment) => {
    try {
      await hospitalService.callNextSmartQueue(id, dept || selectedDept);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error calling next patient');
    }
  };

  const handleSkip = async (id: string) => {
    try {
      await hospitalService.skipSmartQueue(id);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error skipping patient');
    }
  };

  const handleRecall = async (id: string) => {
    try {
      await hospitalService.recallSmartQueue(id);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error recalling patient');
    }
  };

  const handleInService = async (id: string) => {
    try {
      await hospitalService.markInServiceSmartQueue(id);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await hospitalService.completeSmartQueue(id);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error completing service');
    }
  };

  const handleEmergency = async (id: string) => {
    try {
      await hospitalService.markEmergencySmartQueue(id);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error marking emergency');
    }
  };

  const handleTransfer = async (id: string, targetDept: QueueDepartment, notes: string) => {
    try {
      await hospitalService.transferSmartQueue(id, targetDept, notes);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error transferring queue');
    }
  };

  const handleCreateToken = async (data: {
    department: QueueDepartment;
    patientName: string;
    mrn?: string;
    patientPhone?: string;
    serviceProvider?: string;
    priority?: QueueItemPriority;
    serviceDuration?: number;
    counterNumber?: string;
  }) => {
    try {
      await hospitalService.createSmartQueueItem(data);
      await fetchQueueData();
    } catch (err: any) {
      alert(err.message || 'Error issuing token');
    }
  };

  // Stats across all queues
  const totalWaiting = queueItems.filter(
    (q) => q.status === 'WAITING' || q.status === 'EMERGENCY'
  ).length;
  const totalInService = queueItems.filter(
    (q) => q.status === 'IN_SERVICE' || q.status === 'CALLING'
  ).length;
  const totalCompleted = queueItems.filter((q) => q.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-teal-950 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-sky-500/20 rounded-xl border border-sky-400/30 text-teal-300">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">
                  Smart Hospital Queue Management System
                </h1>
                <p className="text-xs text-sky-200">
                  Real-time multi-department queue routing for Registration, General OPD, Specialist OPD, Laboratory, Pharmacy, and Billing.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">
                Total Waiting
              </span>
              <span className="text-lg font-black text-amber-300 font-mono">{totalWaiting}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">
                In Service
              </span>
              <span className="text-lg font-black text-teal-300 font-mono">{totalInService}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-white/10 text-center">
              <span className="text-[10px] text-sky-200 uppercase font-bold block">
                Completed
              </span>
              <span className="text-lg font-black text-emerald-400 font-mono">{totalCompleted}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchQueueData}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* 6 Department Summary Load Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            6 Department Live Queue Load & Status
          </h3>
          <span className="text-[11px] text-slate-500">
            Queue Color Code: <span className="text-emerald-600 font-bold">Green = Low</span> &bull;{' '}
            <span className="text-amber-600 font-bold">Yellow = Moderate</span> &bull;{' '}
            <span className="text-orange-600 font-bold">Orange = High</span> &bull;{' '}
            <span className="text-rose-600 font-bold">Red = Critical</span>
          </span>
        </div>
        <DepartmentSummaryCard
          queueItems={queueItems}
          onSelectDepartment={(dept) => setSelectedDept(dept)}
          activeDepartment={selectedDept}
        />
      </div>

      {/* Mode Navigation Tabs: Patient View vs Staff View */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveView('patient')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeView === 'patient'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>Patient Queue View</span>
          </button>

          <button
            onClick={() => setActiveView('staff')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              activeView === 'staff'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="h-4 w-4 text-sky-400" />
            <span>Staff Queue Command Desk</span>
          </button>
        </div>

        <Badge variant="teal" className="text-xs font-mono">
          Auto Sync: Active (8s)
        </Badge>
      </div>

      {/* Render Active View */}
      {activeView === 'patient' ? (
        <PatientQueueView
          queueItems={queueItems}
          onRefresh={fetchQueueData}
          currentUserMrn="MRN-2026-8812"
          currentUserName="David Miller"
        />
      ) : (
        <StaffQueueView
          queueItems={queueItems}
          onCallNext={handleCallNext}
          onSkip={handleSkip}
          onRecall={handleRecall}
          onInService={handleInService}
          onComplete={handleComplete}
          onEmergency={handleEmergency}
          onTransfer={handleTransfer}
          onCreateToken={handleCreateToken}
          onRefresh={fetchQueueData}
        />
      )}
    </div>
  );
}
