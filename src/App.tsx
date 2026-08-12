import { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { LandingPageModule } from './components/modules/LandingPageModule';
import { OverviewDashboardModule } from './components/modules/OverviewDashboardModule';
import { SmartQueueSystemModule } from './components/modules/SmartQueueSystemModule';
import { NavigationModule } from './components/modules/NavigationModule';
import { DoctorScheduleModule } from './components/modules/DoctorScheduleModule';
import { NurseStationModule } from './components/modules/NurseStationModule';
import { PharmacyBillingModule } from './components/modules/PharmacyBillingModule';
import { LoginPage } from './components/auth/LoginPage';
import { RegisterPage } from './components/auth/RegisterPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { PatientDashboard } from './components/dashboards/PatientDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { NurseDashboard } from './components/dashboards/NurseDashboard';
import { AttenderDashboard } from './components/dashboards/AttenderDashboard';
import { PharmacyDashboard } from './components/dashboards/PharmacyDashboard';

import { Building2, ShieldCheck, Heart } from 'lucide-react';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<string>('landing');

  // Sync tab state with URL path on load and back button
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin/dashboard')) setActiveTab('admin-dashboard');
    else if (path.includes('/patient/dashboard')) setActiveTab('patient-dashboard');
    else if (path.includes('/doctor/dashboard')) setActiveTab('doctor-dashboard');
    else if (path.includes('/nurse/dashboard')) setActiveTab('nurse-dashboard');
    else if (path.includes('/attender/dashboard')) setActiveTab('attender-dashboard');
    else if (path.includes('/pharmacy/dashboard')) setActiveTab('pharmacy-dashboard');
    else if (path.includes('/login')) setActiveTab('login');
    else if (path.includes('/register')) setActiveTab('register');

    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.includes('/admin/dashboard')) setActiveTab('admin-dashboard');
      else if (p.includes('/patient/dashboard')) setActiveTab('patient-dashboard');
      else if (p.includes('/doctor/dashboard')) setActiveTab('doctor-dashboard');
      else if (p.includes('/nurse/dashboard')) setActiveTab('nurse-dashboard');
      else if (p.includes('/attender/dashboard')) setActiveTab('attender-dashboard');
      else if (p.includes('/pharmacy/dashboard')) setActiveTab('pharmacy-dashboard');
      else if (p.includes('/login')) setActiveTab('login');
      else if (p.includes('/register')) setActiveTab('register');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
    let targetPath = '/';
    if (tab === 'admin-dashboard') targetPath = '/admin/dashboard';
    else if (tab === 'patient-dashboard') targetPath = '/patient/dashboard';
    else if (tab === 'doctor-dashboard') targetPath = '/doctor/dashboard';
    else if (tab === 'nurse-dashboard') targetPath = '/nurse/dashboard';
    else if (tab === 'attender-dashboard') targetPath = '/attender/dashboard';
    else if (tab === 'pharmacy-dashboard') targetPath = '/pharmacy/dashboard';
    else if (tab === 'login') targetPath = '/login';
    else if (tab === 'register') targetPath = '/register';

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 font-sans flex flex-col antialiased">
      {/* Platform Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={handleNavigateTab} />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Public Modules */}
        {activeTab === 'landing' && (
          <LandingPageModule
            onNavigateTab={handleNavigateTab}
            setUserRole={() => {}}
          />
        )}

        {activeTab === 'overview' && <OverviewDashboardModule onNavigateTab={handleNavigateTab} />}

        {activeTab === 'queue' && <SmartQueueSystemModule />}

        {activeTab === 'navigation' && <NavigationModule />}

        {activeTab === 'doctors' && <DoctorScheduleModule />}

        {activeTab === 'nurses' && <NurseStationModule />}

        {activeTab === 'pharmacy' && <PharmacyBillingModule />}

        {/* Authentication Pages */}
        {activeTab === 'login' && (
          <LoginPage
            onSwitchToRegister={() => handleNavigateTab('register')}
            onLoginSuccess={(role) => handleNavigateTab(`${role.toLowerCase()}-dashboard`)}
          />
        )}

        {activeTab === 'register' && (
          <RegisterPage
            onSwitchToLogin={() => handleNavigateTab('login')}
            onRegisterSuccess={(role) => handleNavigateTab(`${role.toLowerCase()}-dashboard`)}
          />
        )}

        {/* Protected Role Dashboards */}
        {activeTab === 'admin-dashboard' && (
          <ProtectedRoute allowedRoles={['ADMIN']} onNavigateTab={handleNavigateTab}>
            <AdminDashboard />
          </ProtectedRoute>
        )}

        {activeTab === 'patient-dashboard' && (
          <ProtectedRoute allowedRoles={['PATIENT', 'ADMIN']} onNavigateTab={handleNavigateTab}>
            <PatientDashboard onNavigateTab={handleNavigateTab} />
          </ProtectedRoute>
        )}

        {activeTab === 'doctor-dashboard' && (
          <ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} onNavigateTab={handleNavigateTab}>
            <DoctorDashboard />
          </ProtectedRoute>
        )}

        {activeTab === 'nurse-dashboard' && (
          <ProtectedRoute allowedRoles={['NURSE', 'ADMIN']} onNavigateTab={handleNavigateTab}>
            <NurseDashboard />
          </ProtectedRoute>
        )}

        {activeTab === 'attender-dashboard' && (
          <ProtectedRoute allowedRoles={['ATTENDER', 'ADMIN']} onNavigateTab={handleNavigateTab}>
            <AttenderDashboard onNavigateTab={handleNavigateTab} />
          </ProtectedRoute>
        )}

        {activeTab === 'pharmacy-dashboard' && (
          <ProtectedRoute allowedRoles={['PHARMACY', 'ADMIN']} onNavigateTab={handleNavigateTab}>
            <PharmacyDashboard />
          </ProtectedRoute>
        )}
      </main>

      {/* Platform Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-sm">
                Smart Hospital Connectivity Platform
              </span>
              <span className="text-[11px] text-slate-500">
                Community Service Technology &bull; Role-Based Security & OPD Queue Sync
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center text-slate-600">
              <ShieldCheck className="h-4 w-4 mr-1 text-emerald-600" />
              PBKDF2 Password Hashing & Role Authorization
            </span>
            <span className="flex items-center text-rose-600 font-semibold">
              <Heart className="h-4 w-4 mr-1 fill-rose-600" />
              Community Service Project
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

