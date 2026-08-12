import React from 'react';
import { QueueItemPriority } from '../../types';

interface QueuePriorityBadgeProps {
  priority: QueueItemPriority;
  className?: string;
}

export function QueuePriorityBadge({ priority, className = '' }: QueuePriorityBadgeProps) {
  // Queue Colors requirement:
  // Green = Low
  // Yellow = Moderate
  // Orange = High
  // Red = Critical
  switch (priority) {
    case 'Low':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
          Low
        </span>
      );
    case 'Moderate':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          Moderate
        </span>
      );
    case 'High':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 shadow-2xs ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></span>
          High
        </span>
      );
    case 'Critical':
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
          Critical (Emergency)
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          {priority}
        </span>
      );
  }
}
