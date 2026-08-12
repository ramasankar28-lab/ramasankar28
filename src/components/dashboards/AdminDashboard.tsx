import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, User } from '../../types';
import {
  ShieldCheck,
  Users,
  UserPlus,
  Activity,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Lock,
  Mail,
  Phone,
  Badge
} from 'lucide-react';
import { Button } from '../ui/Button';
import { authService } from '../../services/authService';

export function AdminDashboard() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Staff creation form state
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<UserRole>('DOCTOR');
  const [staffDepartment, setStaffDepartment] = useState('General Medicine & OPD');
  const [staffRoom, setStaffRoom] = useState('Room 102');
  const [staffPhone, setStaffPhone] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!staffName || !staffEmail || !staffPassword) {
      setFeedbackMsg({ type: 'error', text: 'Please fill name, email, and password' });
      return;
    }

    setIsSubmittingStaff(true);
    try {
      await authService.createStaffAccount({
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
        departmentName: staffDepartment,
        roomNumber: staffRoom,
        phone: staffPhone
      });

      setFeedbackMsg({ type: 'success', text: `Staff account created for ${staffName} (${staffRole})` });
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      setIsCreatingStaff(false);
      fetchUsers();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to create staff account' });
    } fontFinally: {
      setIsSubmittingStaff(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.mrn && u.mrn.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Admin Welcome Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Root Hospital Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            System Control & User Provisioning
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Logged in as <strong className="text-white">{user?.name}</strong> ({user?.email}). Manage hospital staff accounts, patient records, and role security.
          </p>
        </div>

        <Button
          variant="teal"
          onClick={() => setIsCreatingStaff(!isCreatingStaff)}
          className="flex items-center gap-2 shadow-lg shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isCreatingStaff ? 'Close Staff Form' : 'Create Staff Account'}</span>
        </Button>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Staff Provisioning Form */}
      {isCreatingStaff && (
        <div className="bg-white rounded-2xl border border-teal-200 shadow-xl p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900">Provision Staff Credential</h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">Role-Based Staff Registration</span>
          </div>

          <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Role Type
              </label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="PHARMACY">Pharmacy Staff</option>
                <option value="ATTENDER">Patient Attender / Guide</option>
                <option value="ADMIN">Co-Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Dr. Maya Patel"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Staff Email Address
              </label>
              <input
                type="email"
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="staff@smarthospital.org"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Secure Password
              </label>
              <input
                type="password"
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department / Station
              </label>
              <input
                type="text"
                value={staffDepartment}
                onChange={(e) => setStaffDepartment(e.target.value)}
                placeholder="e.g. Cardiology"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room / Counter #
              </label>
              <input
                type="text"
                value={staffRoom}
                onChange={(e) => setStaffRoom(e.target.value)}
                placeholder="Room 205"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreatingStaff(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="teal" disabled={isSubmittingStaff}>
                {isSubmittingStaff ? 'Creating Account...' : 'Issue Staff Credentials'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Admin Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Accounts</span>
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{usersList.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Patients & Staff Provisioned</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Doctors</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {usersList.filter((u) => u.role === 'DOCTOR').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Consultants on Duty</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Registered Patients</span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {usersList.filter((u) => u.role === 'PATIENT').length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">MRN Health Profiles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clinical Support</span>
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {usersList.filter((u) => ['NURSE', 'PHARMACY', 'ATTENDER'].includes(u.role)).length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Nurses, Pharmacy & Guides</p>
        </div>
      </div>

      {/* User Accounts Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Hospital User Directory & Roles</h3>
            <p className="text-xs text-slate-500">View and verify all registered hospital accounts</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, email, MRN..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-700"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="ATTENDER">Attender</option>
              <option value="PHARMACY">Pharmacy</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Account User</th>
                <th className="px-4 py-3">Role Badge</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">MRN / Station</th>
                <th className="px-4 py-3">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-rose-100 text-rose-800'
                            : u.role === 'DOCTOR'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'NURSE'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'PATIENT'
                            ? 'bg-teal-100 text-teal-800'
                            : u.role === 'ATTENDER'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" /> {u.phone}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {u.mrn || u.roomNumber || u.departmentName || 'General Staff'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
