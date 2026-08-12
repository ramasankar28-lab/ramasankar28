import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatWaitTime(minutes: number): string {
  if (minutes <= 0) return 'Immediate / Next Up';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'IN_CONSULTATION':
    case 'IN_PROGRESS':
    case 'PAID':
    case 'DISPENSED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'WAITING':
    case 'PENDING':
    case 'PREPARING':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'READY_FOR_PICKUP':
      return 'bg-teal-100 text-teal-800 border-teal-200';
    case 'COMPLETED':
    case 'CONFIRMED':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'SKIPPED':
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'EMERGENCY':
      return { label: 'Emergency', className: 'bg-rose-500 text-white animate-pulse' };
    case 'SENIOR_CITIZEN':
      return { label: 'Senior Citizen', className: 'bg-purple-600 text-white' };
    case 'PREGNANT_OR_DISABLED':
      return { label: 'Special Assistance', className: 'bg-amber-600 text-white' };
    default:
      return { label: 'Regular Token', className: 'bg-slate-100 text-slate-700' };
  }
}
