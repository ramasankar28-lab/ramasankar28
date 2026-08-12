import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  Stethoscope,
  HeartPulse,
  User,
  Users,
  Pill,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onLoginSuccess?: (role: UserRole) => void;
}

export function LoginPage({ onSwitchToRegister, onLoginSuccess }: LoginPageProps) {
  const { login, demoLogin } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('PATIENT');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const demoAccounts: {
    role: UserRole;
    label: string;
    email: string;
    icon: React.ElementType;
    badgeColor: string;
    desc: string;
  }[] = [
    {
      role: 'ADMIN',
      label: 'Admin Console',
      email: 'admin@smarthospital.org',
      icon: ShieldCheck,
      badgeColor: 'bg-rose-500/10 text-rose-700 border-rose-200',
      desc: 'Full hospital & staff management'
    },
    {
      role: 'PATIENT',
      label: 'Patient Portal',
      email: 'patient@smarthospital.org',
      icon: User,
      badgeColor: 'bg-teal-500/10 text-teal-700 border-teal-200',
      desc: 'Live OPD queue, tokens & appointments'
    },
    {
      role: 'DOCTOR',
      label: 'Doctor OPD Desk',
      email: 'doctor@smarthospital.org',
      icon: Stethoscope,
      badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-200',
      desc: 'Consultation & token caller'
    },
    {
      role: 'NURSE',
      label: 'Nurse Station',
      email: 'nurse@smarthospital.org',
      icon: HeartPulse,
      badgeColor: 'bg-purple-500/10 text-purple-700 border-purple-200',
      desc: 'Bed telemetry & vitals logs'
    },
    {
      role: 'ATTENDER',
      label: 'Patient Attender',
      email: 'attender@smarthospital.org',
      icon: Users,
      badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-200',
      desc: 'Wayfinding & live tracking'
    },
    {
      role: 'PHARMACY',
      label: 'Pharmacy Desk',
      email: 'pharmacy@smarthospital.org',
      icon: Pill,
      badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      desc: 'E-prescriptions & medicine dispense'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername.trim() || !password) {
      setErrorMsg('Please enter email or username and password');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const loggedUser = await login(emailOrUsername.trim(), password, rememberMe);
      if (onLoginSuccess) {
        onLoginSuccess(loggedUser.role);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoClick = async (role: UserRole) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const demoUser = await demoLogin(role);
      if (onLoginSuccess) {
        onLoginSuccess(demoUser.role);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-sm font-semibold mb-3">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Role-Based Secure Portal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Smart Hospital Connectivity Access
        </h1>
        <p className="mt-2 text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
          Sign in to access your customized role console or test-drive with 1-click demo logins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Login Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Account Login</h2>
              <p className="text-xs text-slate-5-00 text-slate-500">Enter your credentials to manage care</p>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <Building2 className="w-6 h-6 text-teal-600" />
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Preference Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Access Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PATIENT', 'DOCTOR', 'NURSE', 'ADMIN', 'ATTENDER', 'PHARMACY'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedRole(r);
                      // Auto populate email for convenience
                      const demo = demoAccounts.find((d) => d.role === r);
                      if (demo) setEmailOrUsername(demo.email);
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                      selectedRole === r
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'ADMIN' && 'Admin'}
                    {r === 'PATIENT' && 'Patient'}
                    {r === 'DOCTOR' && 'Doctor'}
                    {r === 'NURSE' && 'Nurse'}
                    {r === 'ATTENDER' && 'Attender'}
                    {r === 'PHARMACY' && 'Pharmacy'}
                  </button>
                ))}
              </div>
            </div>

            {/* Email / Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. patient@smarthospital.org"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-slate-900 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm text-slate-900 bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs text-slate-600 font-medium">Remember me on this device</span>
              </label>
              <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
              </span>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all text-sm"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In as {selectedRole}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Registration Trigger */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a new patient seeking OPD consultation or appointments?
            </p>
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="mt-2 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-4 py-2.5 rounded-xl border border-teal-200 transition-all inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Register New Patient Account</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Login Cards */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">Instant Demo Login</h3>
              </div>
              <Badge variant="teal">1-Click Test</Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Explore the hospital platform from any role perspective without needing to type passwords:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoClick(account.role)}
                    disabled={isSubmitting}
                    className="text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-teal-500 p-3.5 rounded-xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-700/60 group-hover:bg-teal-600 group-hover:text-white text-teal-400 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-white group-hover:text-teal-300 truncate">
                            {account.label}
                          </h4>
                          <span className="text-[10px] text-teal-400 font-mono">Demo</span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{account.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" /> Demo Passwords: <code className="text-amber-300">Role@123</code>
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> Sessions Active
              </span>
            </div>
          </div>

          {/* Role Access Hierarchy Notice */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Role-Based Security Policy
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Each role is redirected to its dedicated dashboard upon login.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Unauthorized cross-role access is blocked by server-side guards.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-600 font-bold">•</span>
                <span>Staff user creation (Doctor, Nurse, Pharmacy, Attender) is restricted to Admin.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <ForgotPasswordModal onClose={() => setIsForgotPasswordOpen(false)} />
      )}
    </div>
  );
}
