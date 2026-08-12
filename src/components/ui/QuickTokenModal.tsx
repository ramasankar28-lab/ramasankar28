import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Department, Doctor, PriorityLevel } from '../../types';
import { hospitalService } from '../../services/hospitalService';
import { Ticket, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QuickTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  doctors: Doctor[];
  onTokenIssued: () => void;
}

export function QuickTokenModal({
  isOpen,
  onClose,
  departments,
  doctors,
  onTokenIssued
}: QuickTokenModalProps) {
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  const [loading, setLoading] = useState(false);
  const [issuedResult, setIssuedResult] = useState<any>(null);

  const filteredDoctors = selectedDeptId
    ? doctors.filter((d) => d.departmentId === selectedDeptId)
    : doctors;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !selectedDeptId) return;

    setLoading(true);
    try {
      const docId = selectedDocId || (filteredDoctors[0]?.id || doctors[0]?.id);
      const token = await hospitalService.issueToken({
        patientName,
        patientPhone: patientPhone || '+1 (555) 123-4567',
        departmentId: selectedDeptId,
        doctorId: docId,
        priority
      });
      setIssuedResult(token);
      onTokenIssued();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setIssuedResult(null);
    setPatientName('');
    setPatientPhone('');
    setSelectedDeptId('');
    setSelectedDocId('');
    setPriority('NORMAL');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Instant OPD Digital Token Kiosk"
      description="Bypass long counter registration queues. Issue your token digitally."
    >
      {issuedResult ? (
        <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Token Issued Successfully
            </span>
            <div className="text-4xl font-extrabold text-sky-700 tracking-tight my-1">
              {issuedResult.tokenNumber}
            </div>
            <p className="text-sm font-semibold text-slate-800">{issuedResult.departmentName}</p>
            <p className="text-xs text-slate-500">
              Assigned to: <span className="font-medium text-slate-700">{issuedResult.doctorName}</span> ({issuedResult.counterNumber})
            </p>
          </div>

          <div className="bg-sky-50 rounded-xl p-4 border border-sky-200/70 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Patient Name:</span>
              <span className="font-semibold">{issuedResult.patientName}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Medical Record No:</span>
              <span className="font-mono font-semibold">{issuedResult.mrn}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Estimated Wait:</span>
              <span className="font-bold text-sky-800">{issuedResult.estimatedWaitMinutes} minutes</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Priority Pass:</span>
              <span className="font-semibold uppercase text-slate-800">{issuedResult.priority}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Keep this token screen open or check Live Queue to monitor your position.
          </p>

          <Button variant="primary" className="w-full" onClick={resetAndClose}>
            Done & Track Token Live
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Patient Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Phone Number
            </label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Department <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  setSelectedDocId('');
                }}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="">-- Choose OPD --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} (~{d.avgWaitTimeMinutes}m wait)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Doctor (Optional)
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
              >
                <option value="">-- Any Available Doctor --</option>
                {filteredDoctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.roomNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Priority Pass / Special Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'NORMAL', label: 'Regular Patient', desc: 'Standard Queue' },
                { id: 'SENIOR_CITIZEN', label: 'Senior Citizen', desc: 'Fast Track' },
                { id: 'PREGNANT_OR_DISABLED', label: 'Special Assistance', desc: 'Fast Track' },
                { id: 'EMERGENCY', label: 'Emergency', desc: 'Immediate Priority' }
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPriority(p.id as PriorityLevel)}
                  className={`p-2 rounded-lg text-left border transition-all cursor-pointer ${
                    priority === p.id
                      ? 'border-sky-600 bg-sky-50 text-sky-900 shadow-2xs font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] text-slate-500">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              By issuing a digital token, your appointment will be queued instantly in the OPD screen, saving up to 45 minutes of registration desk waiting time.
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button variant="teal" type="submit" disabled={loading || !selectedDeptId}>
              <Ticket className="h-4 w-4 mr-1.5" />
              {loading ? 'Generating Token...' : 'Generate Digital Token'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
