import React from 'react';
import { QueueItemStatus } from '../../types';

interface QueueStatusBadgeProps {
  status: QueueItemStatus;
  className?: string;
}

export function QueueStatusBadge({ status, className = '' }: QueueStatusBadgeProps) {
  switch (status) {
    case 'WAITING':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-ping"></span>
          Waiting in Line
        </span>
      );
    case 'CALLING':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-sky-100 text-sky-900 border border-sky-300 animate-pulse ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-600 mr-1.5"></span>
          Calling Now
        </span>
      );
    case 'IN_SERVICE':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-teal-600 mr-1.5"></span>
          In Service
        </span>
      );
    case 'COMPLETED':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        >
          Completed
        </span>
      );
    case 'SKIPPED':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300 ${className}`}
        >
          Skipped
        </span>
      );
    case 'EMERGENCY':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-rose-100 text-rose-900 border border-rose-300 animate-bounce ${className}`}
        >
          EMERGENCY
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-700 ${className}`}
        >
          {status}
        </span>
      );
  }
}
