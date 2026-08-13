import { useState, useEffect } from 'react';
import {
  Activity,
  UserCheck,
  PhoneCall,
  Clock,
  Building2,
  Stethoscope,
  HeartPulse,
  Pill,
  BarChart3,
  MapPin,
  Menu,
  X,
  Bell,
  Sparkles,
  LogOut,
  LogIn,
  User,
  ShieldCheck,
  Users,
  Brain,
  MessageSquare
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { appNotificationService } from '../../services/notificationService';
import { messageService } from '../../services/messageService';
import { NotificationDrawer } from '../notifications/NotificationDrawer';
import { CommunicationCenterModal } from '../communication/CommunicationCenterModal';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ activeTab, setActiveTab }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [communicationModalOpen, setCommunicationModalOpen] = useState(false);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const { user, isAuthenticated, logout } = useAuth();
  const currentRole = user?.role || 'PATIENT';
  const currentMrn = user?.mrn || 'MRN-88291';

  useEffect(() => {
    const updateCounts = () => {
      const notifCount = appNotificationService.getUnreadCount(currentRole, currentMrn);
      const msgCount = messageService.getUnreadMessagesCount(currentRole);
      setUnreadNotifCount(notifCount);
      setUnreadMessageCount(msgCount);
    };

    updateCounts();
    const unsubNotif = appNotificationService.subscribe(updateCounts);
    const unsubMsg = messageService.subscribe(updateCounts);

    return () => {
      unsubNotif();
      unsubMsg();
    };
  }, [currentRole, currentMrn]);

  const navItems = [
    { id: 'landing', label: 'Home Landing', icon: Sparkles },
    { id: 'overview', label: 'Overview & Impact', icon: BarChart3 },
    { id: 'queue', label: 'Live OPD Queue', icon: Clock },
    { id: 'prediction', label: 'AI Queue Predictor', icon: Brain },
    { id: 'navigation', label: 'Wayfinding & Counters', icon: MapPin },
    { id: 'doctors', label: 'Doctor Schedule', icon: Stethoscope },
    { id: 'nurses', label: 'Nurse Station', icon: HeartPulse },
    { id: 'pharmacy', label: 'Pharmacy & Billing', icon: Pill }
  ];

  const roleDashboardTabs: { id: string; label: string; role: UserRole; icon: any }[] = [
    { id: 'admin-dashboard', label: 'Admin Console', role: 'ADMIN', icon: ShieldCheck },
    { id: 'patient-dashboard', label: 'Patient Portal', role: 'PATIENT', icon: User },
    { id: 'doctor-dashboard', label: 'Doctor OPD Desk', role: 'DOCTOR', icon: Stethoscope },
    { id: 'nurse-dashboard', label: 'Nurse Station', role: 'NURSE', icon: HeartPulse },
    { id: 'attender-dashboard', label: 'Patient Attender', role: 'ATTENDER', icon: Users },
    { id: 'pharmacy-dashboard', label: 'Pharmacy Desk', role: 'PHARMACY', icon: Pill }
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
      {/* Top Banner: Emergency Helpline & Status */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-teal-900 text-white px-4 py-1.5 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-sky-200 font-medium">
            <Activity className="h-3.5 w-3.5 mr-1 text-teal-300 animate-pulse" />
            Smart Hospital Connectivity
          </span>
          <span className="hidden sm:inline text-sky-300/60">|</span>
          <span className="hidden sm:inline text-sky-100">
            Real-time OPD Token & Role Access Matrix
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="tel:108"
            className="flex items-center text-rose-200 hover:text-white font-semibold bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-400/30 transition-colors"
          >
            <PhoneCall className="h-3 w-3 mr-1 animate-bounce" />
            Emergency 108
          </a>
          <span className="text-sky-200 hidden md:inline">
            OPD Hours: 08:00 AM - 08:00 PM
          </span>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('landing')}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Smart Hospital
                </h1>
                <Badge variant="teal" className="text-[10px] px-1.5 py-0">
                  Secure Auth
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Hospital Connectivity & Portal
              </p>
            </div>
          </div>

          {/* User Auth Status, Notification Bell, & Messaging Center */}
          <div className="flex items-center space-x-2">
            {/* Communication Messages Button */}
            <button
              onClick={() => setCommunicationModalOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 bg-slate-50"
              title="Secure Hospital Messages & Clinical Handoff"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-600 text-white font-extrabold text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadMessageCount}
                </span>
              )}
            </button>

            {/* Notification Bell Button */}
            <button
              onClick={() => setNotificationDrawerOpen(true)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-sky-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200/80 bg-slate-50"
              title="Notifications & Priority Alerts"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-extrabold text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 bg-slate-50 p-1.5 pl-3 rounded-xl border border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] text-teal-700 font-bold uppercase font-mono">{user.role} Dashboard</div>
                </div>

                <button
                  onClick={() => setActiveTab(`${user.role.toLowerCase()}-dashboard`)}
                  className="px-2.5 py-1 text-xs font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  My Portal
                </button>

                <button
                  onClick={async () => {
                    await logout();
                    setActiveTab('login');
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  title="Log Out Session"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('login')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-xs"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Register Patient</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex space-x-1 border-t border-slate-100 pt-1 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 border border-sky-200/80 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 mr-1.5 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-slate-200 my-auto mx-1" />

          {/* Role Dashboard Shortcuts */}
          {isAuthenticated && user && (
            <button
              onClick={() => setActiveTab(`${user.role.toLowerCase()}-dashboard`)}
              className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === `${user.role.toLowerCase()}-dashboard`
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 mr-1.5" />
              My {user.role} Console
            </button>
          )}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3">
          {isAuthenticated && user ? (
            <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900">{user.name}</div>
                <div className="text-[10px] text-teal-700 font-bold uppercase">{user.role} Account</div>
              </div>
              <button
                onClick={() => {
                  setActiveTab(`${user.role.toLowerCase()}-dashboard`);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-bold"
              >
                Go to Console
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('login');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl text-center"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setActiveTab('register');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-xs font-bold text-white bg-teal-600 rounded-xl text-center shadow-xs"
              >
                Register Patient
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notification Drawer Overlay */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        onNavigateTab={setActiveTab}
      />

      {/* Communication Center Modal */}
      <CommunicationCenterModal
        isOpen={communicationModalOpen}
        onClose={() => setCommunicationModalOpen(false)}
      />
    </header>
  );
}
