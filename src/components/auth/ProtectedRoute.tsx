import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { Button } from '../ui/Button';
import { LoginPage } from './LoginPage';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: React.ReactNode;
  onNavigateTab: (tabId: string) => void;
  onSwitchToRegister?: () => void;
}

export function ProtectedRoute({
  allowedRoles,
  children,
  onNavigateTab,
  onSwitchToRegister
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Verifying session token & access permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <LoginPage
        onSwitchToRegister={onSwitchToRegister || (() => onNavigateTab('register'))}
        onLoginSuccess={(role) => {
          onNavigateTab(`${role.toLowerCase()}-dashboard`);
        }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Access Restricted — Unauthorized Role
        </h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          You are currently logged in as <strong className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-mono">{user.role}</strong> ({user.name}).
          This module is reserved exclusively for <strong className="text-slate-800">{allowedRoles.join(' or ')}</strong> access.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600 max-w-md mx-auto">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-teal-600" /> Security Protocol Note
          </p>
          <p>Multi-role authorization protects confidential patient records and clinical telemetry.</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="teal"
            onClick={() => onNavigateTab(`${user.role.toLowerCase()}-dashboard`)}
            className="flex items-center gap-2"
          >
            <span>Go to My {user.role} Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
