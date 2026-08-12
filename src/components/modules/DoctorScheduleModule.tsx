import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Calendar,
  Clock,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Doctor, Appointment, Department } from '../../types';
import { hospitalService } from '../../services/hospitalService';

export function DoctorScheduleModule() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Appointment Form state
  const [aptModalOpen, setAptModalOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [selectedDocId, setSelectedDocId] = useState('');
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:30 AM');
  const [symptoms, setSymptoms] = useState('');

  const loadData = async () => {
    try {
      const [docs, depts, apts] = await Promise.all([
        hospitalService.getDoctors(),
        hospitalService.getDepartments(),
        hospitalService.getAppointments()
      ]);
      setDoctors(docs);
      setDepartments(depts);
      setAppointments(apts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !selectedDocId) return;

    try {
      await hospitalService.bookAppointment({
        patientName,
        patientPhone,
        doctorId: selectedDocId,
        date: aptDate,
        timeSlot,
        symptoms
      });
      setAptModalOpen(false);
      setPatientName('');
      setPatientPhone('');
      setSymptoms('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Doctor OPD Load & Appointment Schedule
            </h2>
            <Badge variant="purple">Burnout Prevention System</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing safe daily token limits (max 25–35 patients) to ensure quality consultation time and reduce doctor working hours.
          </p>
        </div>

        <Button variant="primary" onClick={() => setAptModalOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          + Book OPD Appointment
        </Button>
      </div>

      {/* Doctor OPD Roster Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {doctors.map((doc) => {
          const loadPercentage = Math.min(100, Math.round((doc.totalTokensIssued / doc.maxDailyPatients) * 100));
          const isHighLoad = loadPercentage >= 85;

          return (
            <Card key={doc.id} className="hover:border-sky-300 transition-all shadow-xs">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant={doc.isAvailable ? 'success' : 'danger'} className="mb-1.5">
                      {doc.isAvailable ? 'Available on Duty' : 'On Leave / Break'}
                    </Badge>
                    <CardTitle className="text-base text-slate-900">{doc.name}</CardTitle>
                    <CardDescription className="text-xs text-sky-700 font-medium">
                      {doc.specialization} &bull; {doc.roomNumber}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Shift Timings & Nurse */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Shift Timing</span>
                    <span className="font-semibold text-slate-800">{doc.shiftStart} - {doc.shiftEnd}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">Assigned Nurse</span>
                    <span className="font-medium text-slate-700 truncate block">{doc.activeNurseAssigned}</span>
                  </div>
                </div>

                {/* Consultation Time Pacing Metric */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 font-medium">Daily Patient Cap Meter:</span>
                    <span className="font-bold text-slate-900">
                      {doc.totalTokensIssued} / {doc.maxDailyPatients} Patients
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isHighLoad ? 'bg-amber-500' : 'bg-sky-600'
                      }`}
                      style={{ width: `${loadPercentage}%` }}
                    ></div>
                  </div>

                  {isHighLoad && (
                    <p className="text-[10px] text-amber-700 font-semibold flex items-center pt-0.5">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Approaching doctor daily threshold limit.
                    </p>
                  )}
                </div>

                {/* Average Consultation Duration */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <span>Guaranteed Consultation:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    ~{doc.avgConsultationTimeMins} mins / patient
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Confirmed Appointments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-slate-900">Today's Scheduled Appointments</CardTitle>
              <CardDescription>Pre-booked OPD and follow-up slots</CardDescription>
            </div>
            <Badge variant="info">{appointments.length} Appointments</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 mt-0.5">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{apt.patientName}</h4>
                    <p className="text-xs text-slate-500">
                      Doctor: <span className="font-semibold text-slate-700">{apt.doctorName}</span> &bull; {apt.departmentName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Symptoms: <span className="italic">{apt.symptoms || 'Routine Checkup'}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md block">
                    {apt.timeSlot} ({apt.date})
                  </span>
                  <Badge variant="success" className="mt-1">
                    {apt.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={aptModalOpen}
        onClose={() => setAptModalOpen(false)}
        title="Schedule OPD Appointment"
        description="Book a dedicated time slot to eliminate waiting queues."
      >
        <form onSubmit={handleBookAppointment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Patient Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Clara Bennett"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
            <input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Doctor</label>
            <select
              required
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            >
              <option value="">-- Choose Specialist Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={aptDate}
                onChange={(e) => setAptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Time Slot</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
              >
                <option value="09:30 AM">09:30 AM</option>
                <option value="10:30 AM">10:30 AM</option>
                <option value="11:15 AM">11:15 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="03:30 PM">03:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms / Reason</label>
            <textarea
              rows={2}
              placeholder="e.g. Cough, joint pain, chest tightness"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setAptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm Appointment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
