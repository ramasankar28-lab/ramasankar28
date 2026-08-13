import React from 'react';
import { SmartQueueItem } from '../../types';
import { QueuePriorityBadge } from './QueuePriorityBadge';
import { QueueStatusBadge } from './QueueStatusBadge';
import { Card, CardContent } from '../ui/Card';
import { Clock, User, Building2, Stethoscope, ArrowRightLeft, ShieldAlert } from 'lucide-react';

interface QueueDataCardProps {
  key?: React.Key;
  item: SmartQueueItem;
  onCallNext?: (id: string) => void;
  onSkip?: (id: string) => void;
  onRecall?: (id: string) => void;
  onInService?: (id: string) => void;
  onComplete?: (id: string) => void;
  onEmergency?: (id: string) => void;
  onTransfer?: (item: SmartQueueItem) => void;
  isStaffView?: boolean;
}

export function QueueDataCard({
  item,
  onCallNext,
  onSkip,
  onRecall,
  onInService,
  onComplete,
  onEmergency,
  onTransfer,
  isStaffView = false
}: QueueDataCardProps) {
  return (
    <Card className="hover:border-sky-300 transition-all shadow-2xs relative overflow-hidden bg-white">
      {/* Accent strip based on priority */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          item.priority === 'Critical'
            ? 'bg-rose-500 animate-pulse'
            : item.priority === 'High'
            ? 'bg-orange-500'
            : item.priority === 'Moderate'
            ? 'bg-amber-400'
            : 'bg-emerald-500'
        }`}
      />

      <CardContent className="p-4 pt-4 space-y-3">
        {/* Header: Token Number, Dept, Priority & Status */}
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                #{item.tokenNumber}
              </span>
              <QueuePriorityBadge priority={item.priority} />
            </div>

            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 flex items-center">
                <Building2 className="h-3 w-3 mr-1 text-sky-600" />
                {item.department}
              </span>
              {item.transferredFrom && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  Via {item.transferredFrom}
                </span>
              )}
            </div>
          </div>

          <div className="text-right flex flex-col items-end space-y-1">
            <QueueStatusBadge status={item.status} />
            <span className="text-[10px] text-slate-400 font-mono">ID: {item.id}</span>
          </div>
        </div>

        {/* 11 Explicit Queue Data Fields Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs bg-slate-50/70 p-3 rounded-lg border border-slate-200/80">
          {/* Patient */}
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
            <div className="font-bold text-slate-900 flex items-center mt-0.5">
              <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
              <span className="truncate">{item.patientName}</span>
            </div>
            <span className="text-[10px] text-slate-500 block font-mono">{item.mrn}</span>
          </div>

          {/* Service Provider */}
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Provider</span>
            <div className="font-semibold text-slate-800 flex items-center mt-0.5">
              <Stethoscope className="h-3.5 w-3.5 mr-1 text-teal-600" />
              <span className="truncate">{item.serviceProvider}</span>
            </div>
            {item.counterNumber && (
              <span className="text-[10px] text-teal-700 font-medium block">
                {item.counterNumber}
              </span>
            )}
          </div>

          {/* Queue Position & Est Wait */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Position / Wait</span>
            <div className="font-extrabold text-slate-900 mt-0.5">
              #{item.queuePosition}{' '}
              <span className="text-[11px] font-normal text-slate-600">
                ({item.estimatedWaitMinutes}m wait)
              </span>
            </div>
          </div>

          {/* Arrival Time */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival Time</span>
            <div className="font-medium text-slate-800 flex items-center mt-0.5">
              <Clock className="h-3 w-3 mr-1 text-slate-400" />
              {item.arrivalTime}
            </div>
          </div>

          {/* Start Time */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Start Time</span>
            <div className="font-medium text-slate-800 mt-0.5">
              {item.startTime || <span className="text-slate-400 font-normal">--:--</span>}
            </div>
          </div>

          {/* Completion Time */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Completion Time</span>
            <div className="font-medium text-slate-800 mt-0.5">
              {item.completionTime || <span className="text-slate-400 font-normal">--:--</span>}
            </div>
          </div>

          {/* Service Duration */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Duration</span>
            <div className="font-semibold text-slate-800 mt-0.5">
              {item.serviceDuration} mins
            </div>
          </div>
        </div>

        {/* Transfer Notes if any */}
        {item.transferNotes && (
          <div className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded border border-amber-200/80 flex items-center space-x-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span>
              <strong>Transfer Note:</strong> {item.transferNotes}
            </span>
          </div>
        )}

        {/* Staff Action Toolbar if Staff View */}
        {isStaffView && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 justify-end">
            {(item.status === 'WAITING' || item.status === 'EMERGENCY') && onCallNext && (
              <button
                type="button"
                onClick={() => onCallNext(item.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-colors flex items-center"
              >
                Call Next
              </button>
            )}

            {item.status === 'CALLING' && onInService && (
              <button
                type="button"
                onClick={() => onInService(item.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors flex items-center"
              >
                Mark In Service
              </button>
            )}

            {item.status === 'IN_SERVICE' && onComplete && (
              <button
                type="button"
                onClick={() => onComplete(item.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center"
              >
                Complete
              </button>
            )}

            {item.status === 'SKIPPED' && onRecall && (
              <button
                type="button"
                onClick={() => onRecall(item.id)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
              >
                Recall
              </button>
            )}

            {item.status !== 'SKIPPED' && item.status !== 'COMPLETED' && onSkip && (
              <button
                type="button"
                onClick={() => onSkip(item.id)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Skip
              </button>
            )}

            {item.priority !== 'Critical' && item.status !== 'COMPLETED' && onEmergency && (
              <button
                type="button"
                onClick={() => onEmergency(item.id)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center"
              >
                <ShieldAlert className="h-3 w-3 mr-1 text-rose-600" />
                Emergency
              </button>
            )}

            {item.status !== 'COMPLETED' && onTransfer && (
              <button
                type="button"
                onClick={() => onTransfer(item)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center"
              >
                <ArrowRightLeft className="h-3 w-3 mr-1 text-purple-600" />
                Transfer Queue
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
