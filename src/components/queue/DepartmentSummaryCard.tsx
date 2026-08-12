import React from 'react';
import { SmartQueueItem, QueueDepartment } from '../../types';
import { Card, CardContent } from '../ui/Card';
import { Building2, Users, Clock, ArrowRight } from 'lucide-react';

interface DepartmentSummaryCardProps {
  queueItems: SmartQueueItem[];
  onSelectDepartment: (dept: QueueDepartment) => void;
  activeDepartment?: QueueDepartment;
}

export function DepartmentSummaryCard({
  queueItems,
  onSelectDepartment,
  activeDepartment
}: DepartmentSummaryCardProps) {
  const departments: QueueDepartment[] = [
    'Registration',
    'General OPD',
    'Specialist OPD',
    'Laboratory',
    'Pharmacy',
    'Billing'
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {departments.map((dept) => {
        const deptTokens = queueItems.filter((q) => q.department === dept);
        const waitingCount = deptTokens.filter(
          (q) => q.status === 'WAITING' || q.status === 'EMERGENCY'
        ).length;
        const activeCount = deptTokens.filter(
          (q) => q.status === 'CALLING' || q.status === 'IN_SERVICE'
        ).length;

        // Queue colors logic based on load
        // Green = Low, Yellow = Moderate, Orange = High, Red = Critical
        let loadColor = 'bg-emerald-500 text-emerald-800 border-emerald-300';
        let loadLabel = 'Low';
        let badgeBg = 'bg-emerald-100 text-emerald-800';

        if (waitingCount >= 6) {
          loadColor = 'bg-rose-500 text-rose-800 border-rose-300';
          loadLabel = 'Critical';
          badgeBg = 'bg-rose-100 text-rose-900';
        } else if (waitingCount >= 4) {
          loadColor = 'bg-orange-500 text-orange-800 border-orange-300';
          loadLabel = 'High';
          badgeBg = 'bg-orange-100 text-orange-800';
        } else if (waitingCount >= 2) {
          loadColor = 'bg-amber-400 text-amber-800 border-amber-300';
          loadLabel = 'Moderate';
          badgeBg = 'bg-amber-100 text-amber-800';
        }

        const isSelected = activeDepartment === dept;

        return (
          <Card
            key={dept}
            onClick={() => onSelectDepartment(dept)}
            className={`cursor-pointer transition-all hover:scale-[1.02] shadow-2xs relative overflow-hidden ${
              isSelected ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' : 'bg-white'
            }`}
          >
            {/* Top color indicator bar */}
            <div className={`h-1.5 w-full ${loadColor.split(' ')[0]}`} />

            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 tracking-tight truncate">
                  {dept}
                </span>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${badgeBg}`}>
                  {loadLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {waitingCount}
                  </span>
                  <span className="text-[10px] text-slate-500 block">waiting</span>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-sky-700 font-mono">
                    {activeCount} active
                  </span>
                  <span className="text-[10px] text-slate-400 block">at counter</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
