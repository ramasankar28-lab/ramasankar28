import React, { useState } from 'react';
import { SmartQueueItem, QueueDepartment } from '../../types';
import { QueueDataCard } from './QueueDataCard';
import { IssueTokenModal } from './IssueTokenModal';
import { TransferQueueModal } from './TransferQueueModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Volume2,
  Plus,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
  Building2,
  Filter,
  Search,
  Users
} from 'lucide-react';

interface StaffQueueViewProps {
  queueItems: SmartQueueItem[];
  onCallNext: (id?: string, dept?: QueueDepartment) => void;
  onSkip: (id: string) => void;
  onRecall: (id: string) => void;
  onInService: (id: string) => void;
  onComplete: (id: string) => void;
  onEmergency: (id: string) => void;
  onTransfer: (id: string, targetDept: QueueDepartment, notes: string) => void;
  onCreateToken: (data: any) => void;
  onRefresh: () => void;
}

export function StaffQueueView({
  queueItems,
  onCallNext,
  onSkip,
  onRecall,
  onInService,
  onComplete,
  onEmergency,
  onTransfer,
  onCreateToken,
  onRefresh
}: StaffQueueViewProps) {
  const [selectedDept, setSelectedDept] = useState<QueueDepartment>('General OPD');
  const [searchQuery, setSearchQuery] = useState('');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [transferModalItem, setTransferModalItem] = useState<SmartQueueItem | null>(null);

  const departments: QueueDepartment[] = [
    'Registration',
    'General OPD',
    'Specialist OPD',
    'Laboratory',
    'Pharmacy',
    'Billing'
  ];

  // Filter items for selected department and search
  const filteredItems = queueItems.filter((q) => {
    const matchesDept = q.department === selectedDept;
    const matchesSearch =
      !searchQuery ||
      q.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.mrn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const waitingTokens = filteredItems.filter((q) => q.status === 'WAITING' || q.status === 'EMERGENCY');
  const callingTokens = filteredItems.filter((q) => q.status === 'CALLING');
  const inServiceTokens = filteredItems.filter((q) => q.status === 'IN_SERVICE');
  const completedTokens = filteredItems.filter((q) => q.status === 'COMPLETED');
  const skippedTokens = filteredItems.filter((q) => q.status === 'SKIPPED');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Staff Queue Command Desk
            </h2>
            <Badge variant="teal">Live Queue Management</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage patient queues, call tokens, mark in service, skip, recall, assign emergency priority, or transfer queues across 6 hospital departments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="primary" size="sm" onClick={() => setIsIssueModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Issue New Token
          </Button>
          <Button
            variant="teal"
            size="sm"
            onClick={() => onCallNext(undefined, selectedDept)}
            className="font-bold shadow-2xs"
          >
            <Volume2 className="h-3.5 w-3.5 mr-1 text-teal-200" />
            Call Next Patient
          </Button>
        </div>
      </div>

      {/* Department Selector */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto flex space-x-2 scrollbar-none">
        {departments.map((dept) => {
          const deptCount = queueItems.filter(
            (q) => q.department === dept && (q.status === 'WAITING' || q.status === 'CALLING' || q.status === 'IN_SERVICE' || q.status === 'EMERGENCY')
          ).length;
          const isSelected = selectedDept === dept;

          return (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-4 py-2.5 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap flex items-center space-x-2 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-sky-400" />
              <span>{dept}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {deptCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Staff Action Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, or token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Quick Staff Department Call Button */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onCallNext(undefined, selectedDept)}
            className="w-full sm:w-auto text-xs font-extrabold"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Call Next ({selectedDept})
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs">
            Sync Queue
          </Button>
        </div>
      </div>

      {/* Active Service Column & Queue Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Calling & In Service (Active Counters) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Volume2 className="h-4 w-4 mr-1.5 text-sky-600 animate-pulse" />
              Active Calling & In Service
            </h3>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {callingTokens.length + inServiceTokens.length} Active
            </span>
          </div>

          {[...callingTokens, ...inServiceTokens].length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-400 border-dashed">
              No patients currently at desk. Click "Call Next Patient" to proceed.
            </Card>
          ) : (
            [...callingTokens, ...inServiceTokens].map((item) => (
              <QueueDataCard
                key={item.id}
                item={item}
                onCallNext={(id) => onCallNext(id, selectedDept)}
                onSkip={onSkip}
                onRecall={onRecall}
                onInService={onInService}
                onComplete={onComplete}
                onEmergency={onEmergency}
                onTransfer={(itm) => setTransferModalItem(itm)}
                isStaffView={true}
              />
            ))
          )}
        </div>

        {/* Column 2: Waiting Queue (In Line) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Users className="h-4 w-4 mr-1.5 text-amber-600" />
              Waiting in Queue Line
            </h3>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {waitingTokens.length} Waiting
            </span>
          </div>

          {waitingTokens.length === 0 ? (
            <Card className="p-6 text-center text-xs text-slate-400 border-dashed">
              Queue clear! No waiting patients in line.
            </Card>
          ) : (
            waitingTokens.map((item) => (
              <QueueDataCard
                key={item.id}
                item={item}
                onCallNext={(id) => onCallNext(id, selectedDept)}
                onSkip={onSkip}
                onRecall={onRecall}
                onInService={onInService}
                onComplete={onComplete}
                onEmergency={onEmergency}
                onTransfer={(itm) => setTransferModalItem(itm)}
                isStaffView={true}
              />
            ))
          )}
        </div>

        {/* Column 3: Skipped & Completed Log */}
        <div className="space-y-4">
          {/* Skipped Patients section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">Skipped Patients</h3>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                {skippedTokens.length}
              </span>
            </div>

            {skippedTokens.length === 0 ? (
              <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
                No skipped tokens
              </div>
            ) : (
              <div className="space-y-2">
                {skippedTokens.map((item) => (
                  <QueueDataCard
                    key={item.id}
                    item={item}
                    onCallNext={(id) => onCallNext(id, selectedDept)}
                    onSkip={onSkip}
                    onRecall={onRecall}
                    onInService={onInService}
                    onComplete={onComplete}
                    onEmergency={onEmergency}
                    onTransfer={(itm) => setTransferModalItem(itm)}
                    isStaffView={true}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Recently Completed Log */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Completed Services Today
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {completedTokens.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {completedTokens.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200/60 text-center">
                  No completed tokens yet
                </div>
              ) : (
                completedTokens.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex justify-between items-center"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 block">
                        #{item.tokenNumber} &bull; {item.patientName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Completed at {item.completionTime || '09:40 AM'} ({item.serviceDuration}m)
                      </span>
                    </div>
                    <Badge variant="success" className="text-[10px]">
                      Done
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <IssueTokenModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSubmit={onCreateToken}
      />

      <TransferQueueModal
        isOpen={!!transferModalItem}
        item={transferModalItem}
        onClose={() => setTransferModalItem(null)}
        onSubmit={(id, targetDept, notes) => onTransfer(id, targetDept, notes)}
      />
    </div>
  );
}
