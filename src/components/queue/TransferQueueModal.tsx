import React, { useState } from 'react';
import { SmartQueueItem, QueueDepartment } from '../../types';
import { Button } from '../ui/Button';
import { X, ArrowRightLeft } from 'lucide-react';

interface TransferQueueModalProps {
  isOpen: boolean;
  item: SmartQueueItem | null;
  onClose: () => void;
  onSubmit: (id: string, targetDept: QueueDepartment, notes: string) => void;
}

export function TransferQueueModal({ isOpen, item, onClose, onSubmit }: TransferQueueModalProps) {
  const [targetDept, setTargetDept] = useState<QueueDepartment>('Laboratory');
  const [transferNotes, setTransferNotes] = useState('');

  if (!isOpen || !item) return null;

  const depts: QueueDepartment[] = [
    'Registration',
    'General OPD',
    'Specialist OPD',
    'Laboratory',
    'Pharmacy',
    'Billing'
  ].filter((d) => d !== item.department) as QueueDepartment[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(item.id, targetDept, transferNotes || `Transferred from ${item.department}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ArrowRightLeft className="h-5 w-5 text-purple-300" />
            <h3 className="font-bold text-base">Transfer Patient Queue</h3>
          </div>
          <button onClick={onClose} className="text-purple-200 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-purple-900">
            <span className="font-bold block">Patient Details</span>
            <div>
              {item.patientName} ({item.mrn}) &bull; Current Token: #{item.tokenNumber} in{' '}
              <strong>{item.department}</strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Transfer to Department *</label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value as QueueDepartment)}
              className="w-full rounded-lg border border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50 focus:bg-white"
            >
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Transfer Instructions / Clinical Notes</label>
            <textarea
              rows={3}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="e.g. Stat CBC Lab test ordered, or Fast-track billing clearance..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <ArrowRightLeft className="h-4 w-4 mr-1" />
              Transfer Patient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
