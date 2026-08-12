import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Activity,
  AlertOctagon,
  Thermometer,
  ShieldAlert,
  Edit3,
  Check,
  Search,
  Bell,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PatientVital } from '../../types';
import { hospitalService } from '../../services/hospitalService';

export function NurseStationModule() {
  const [vitals, setVitals] = useState<PatientVital[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVital, setSelectedVital] = useState<PatientVital | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);

  // Edit Form State
  const [heartRate, setHeartRate] = useState<number>(80);
  const [bpSystolic, setBpSystolic] = useState<number>(120);
  const [bpDiastolic, setBpDiastolic] = useState<number>(80);
  const [spO2, setSpO2] = useState<number>(98);
  const [temperature, setTemperature] = useState<number>(37.0);
  const [notes, setNotes] = useState<string>('');

  const fetchVitals = async () => {
    try {
      const data = await hospitalService.getVitals();
      setVitals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitals();
    const interval = setInterval(fetchVitals, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenEdit = (v: PatientVital) => {
    setSelectedVital(v);
    setHeartRate(v.heartRate);
    setBpSystolic(v.bpSystolic);
    setBpDiastolic(v.bpDiastolic);
    setSpO2(v.spO2);
    setTemperature(v.temperature);
    setNotes(v.notes || '');
    setEditModalOpen(true);
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVital) return;

    // Automatic alert status evaluation
    let alertStatus: 'STABLE' | 'WARNING' | 'CRITICAL' = 'STABLE';
    if (spO2 < 92 || heartRate > 115 || temperature > 38.3) {
      alertStatus = 'CRITICAL';
    } else if (spO2 < 95 || heartRate > 100 || temperature > 37.8) {
      alertStatus = 'WARNING';
    }

    try {
      await hospitalService.updateVitals(selectedVital.id, {
        heartRate,
        bpSystolic,
        bpDiastolic,
        spO2,
        temperature,
        alertStatus,
        notes
      });
      setEditModalOpen(false);
      fetchVitals();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredVitals = vitals.filter(
    (v) =>
      v.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.bedNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.ward.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = vitals.filter((v) => v.alertStatus === 'CRITICAL').length;
  const warningCount = vitals.filter((v) => v.alertStatus === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Nurse Station & Continuous Patient Monitoring
            </h2>
            <Badge variant={criticalCount > 0 ? 'danger' : 'success'}>
              {criticalCount > 0 ? `${criticalCount} Critical Alerts` : 'All Vitals Monitored'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated bedside vital telemetry replacing manual paper documentation and alerting nurses to deterioration instantly.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Critical</span>
            <div className="text-sm font-extrabold text-rose-700">{criticalCount} Beds</div>
          </div>
          <div className="h-6 w-px bg-slate-300"></div>
          <div className="text-center px-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Warning</span>
            <div className="text-sm font-extrabold text-amber-700">{warningCount} Beds</div>
          </div>
        </div>
      </div>

      {/* Critical Alarm Alert Banner if critical patients exist */}
      {criticalCount > 0 && (
        <div className="bg-rose-600 text-white p-4 rounded-xl shadow-md flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertOctagon className="h-6 w-6 text-rose-200 shrink-0" />
            <div>
              <h4 className="text-sm font-extrabold uppercase tracking-wide">
                Critical Patient Vital Sign Alert Triggered
              </h4>
              <p className="text-xs text-rose-100">
                Bed vitals exceed safe threshold parameters. Immediate nurse inspection required.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-white text-white font-bold bg-rose-700">
            Action Required
          </Badge>
        </div>
      )}

      {/* Search Input */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by bed #, ward, or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Patient Vital Bed Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredVitals.map((v) => {
          const isCritical = v.alertStatus === 'CRITICAL';
          const isWarning = v.alertStatus === 'WARNING';

          return (
            <Card
              key={v.id}
              className={`transition-all shadow-xs ${
                isCritical
                  ? 'border-2 border-rose-500 bg-rose-50/20'
                  : isWarning
                  ? 'border-2 border-amber-400 bg-amber-50/20'
                  : 'hover:border-sky-300'
              }`}
            >
              <CardHeader className="p-4 pb-3 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {v.ward} &bull; <span className="text-slate-900 font-extrabold">{v.bedNumber}</span>
                    </span>
                    <CardTitle className="text-base text-slate-900 mt-0.5">
                      {v.patientName} ({v.gender}, {v.age}y)
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                      MRN: <span className="font-mono font-medium">{v.mrn}</span> &bull; Assigned to: {v.nurseAssigned}
                    </CardDescription>
                  </div>

                  <Badge
                    variant={isCritical ? 'danger' : isWarning ? 'warning' : 'success'}
                    className="shrink-0"
                  >
                    {v.alertStatus}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* 4 Vital Signs Dashboard Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Heart Rate */}
                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      v.heartRate > 100
                        ? 'bg-rose-100/80 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Heart Rate
                    </span>
                    <span className="text-lg font-black">{v.heartRate}</span>
                    <span className="text-[9px] text-slate-400 block">bpm</span>
                  </div>

                  {/* SpO2 */}
                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      v.spO2 < 92
                        ? 'bg-rose-100/80 border-rose-300 text-rose-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      SpO2
                    </span>
                    <span className="text-lg font-black">{v.spO2}%</span>
                    <span className="text-[9px] text-slate-400 block">Oxygen</span>
                  </div>

                  {/* BP */}
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Blood Pressure
                    </span>
                    <span className="text-base font-black">{v.bpSystolic}/{v.bpDiastolic}</span>
                    <span className="text-[9px] text-slate-400 block">mmHg</span>
                  </div>

                  {/* Temp */}
                  <div
                    className={`p-2.5 rounded-lg border text-center ${
                      v.temperature > 38.0
                        ? 'bg-amber-100/80 border-amber-300 text-amber-900'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Temp
                    </span>
                    <span className="text-lg font-black">{v.temperature}°C</span>
                    <span className="text-[9px] text-slate-400 block">Body Temp</span>
                  </div>
                </div>

                {/* Nurse Notes */}
                {v.notes && (
                  <div className="p-2.5 bg-slate-100/70 rounded-lg text-xs text-slate-700 italic border border-slate-200">
                    "{v.notes}"
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-400">Synced: {v.lastUpdated}</span>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(v)}>
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Log New Vitals
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal to Log Vitals */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Bed Telemetry Log: ${selectedVital?.bedNumber}`}
        description={`Update vital signs for ${selectedVital?.patientName}`}
      >
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Heart Rate (BPM)
              </label>
              <input
                type="number"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                SpO2 Oxygen (%)
              </label>
              <input
                type="number"
                value={spO2}
                onChange={(e) => setSpO2(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BP Systolic</label>
              <input
                type="number"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BP Diastolic</label>
              <input
                type="number"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nurse Clinical Observation Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Vitals & Sync Alerts
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
