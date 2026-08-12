import React, { useState } from 'react';
import { QueueDepartment, QueueItemPriority } from '../../types';
import { Button } from '../ui/Button';
import { X, Ticket, Plus } from 'lucide-react';

interface IssueTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    department: QueueDepartment;
    patientName: string;
    mrn: string;
    patientPhone: string;
    serviceProvider: string;
    priority: QueueItemPriority;
    serviceDuration: number;
    counterNumber: string;
  }) => void;
}

export function IssueTokenModal({ isOpen, onClose, onSubmit }: IssueTokenModalProps) {
  const [department, setDepartment] = useState<QueueDepartment>('Registration');
  const [patientName, setPatientName] = useState('David Miller');
  const [mrn, setMrn] = useState('MRN-2026-8812');
  const [patientPhone, setPatientPhone] = useState('+1 (555) 234-5678');
  const [serviceProvider, setServiceProvider] = useState('Main Service Counter #1');
  const [priority, setPriority] = useState<QueueItemPriority>('Low');
  const [serviceDuration, setServiceDuration] = useState(5);
  const [counterNumber, setCounterNumber] = useState('Counter #1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      department,
      patientName,
      mrn,
      patientPhone,
      serviceProvider,
      priority,
      serviceDuration,
      counterNumber
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-gradient-to-r from-sky-900 to-teal-800 text-white p-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="h-5 w-5 text-teal-300" />
            <h3 className="font-bold text-base">Issue Smart Queue Token</h3>
          </div>
          <button onClick={onClose} className="text-sky-200 hover:text-white p-1 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Department *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value as QueueDepartment)}
              className="w-full rounded-lg border border-slate-300 p-2.5 font-medium text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="Registration">Registration</option>
              <option value="General OPD">General OPD</option>
              <option value="Specialist OPD">Specialist OPD</option>
              <option value="Laboratory">Laboratory</option>
              <option value="Pharmacy">Pharmacy</option>
              <option value="Billing">Billing</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Patient Name *</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">MRN Number</label>
              <input
                type="text"
                value={mrn}
                onChange={(e) => setMrn(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 font-mono text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Queue Priority (Color Code)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as QueueItemPriority)}
                className="w-full rounded-lg border border-slate-300 p-2.5 font-bold text-slate-900 bg-slate-50"
              >
                <option value="Low">Low (Green)</option>
                <option value="Moderate">Moderate (Yellow)</option>
                <option value="High">High (Orange)</option>
                <option value="Critical">Critical (Red Emergency)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Est. Duration (Mins)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={serviceDuration}
                onChange={(e) => setServiceDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Service Provider</label>
              <input
                type="text"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Counter / Room</label>
              <input
                type="text"
                value={counterNumber}
                onChange={(e) => setCounterNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              Generate Token
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
