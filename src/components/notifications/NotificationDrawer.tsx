import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Zap,
  Clock,
  AlertTriangle,
  FileText,
  Pill,
  CreditCard,
  UserCheck,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  ChevronRight
} from 'lucide-react';
import {
  appNotificationService,
  AppNotification,
  NotificationType
} from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function NotificationDrawer({ isOpen, onClose, onNavigateTab }: NotificationDrawerProps) {
  const { user } = useAuth();
  const currentRole = user?.role || 'PATIENT';
  const currentMrn = user?.mrn || 'MRN-88291';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'EMERGENCY'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>(currentRole);
  const [showSimulatePanel, setShowSimulatePanel] = useState(false);

  useEffect(() => {
    const syncNotifs = () => {
      const data = appNotificationService.getNotificationsForRole(roleFilter, currentMrn);
      setNotifications(data);
    };

    syncNotifs();
    const unsubscribe = appNotificationService.subscribe(syncNotifs);
    return () => unsubscribe();
  }, [roleFilter, currentMrn]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'UNREAD') return !n.isRead;
    if (activeTab === 'EMERGENCY') return n.priority === 'EMERGENCY';
    return true;
  });

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        return <Calendar className="h-4 w-4 text-sky-600" />;
      case 'TOKEN_APPROACHING':
        return <Clock className="h-4 w-4 text-amber-600 animate-pulse" />;
      case 'DOCTOR_DELAY':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'QUEUE_DELAY':
        return <Layers className="h-4 w-4 text-purple-600" />;
      case 'LAB_REPORT_READY':
        return <FileText className="h-4 w-4 text-teal-600" />;
      case 'PHARMACY_READY':
        return <Pill className="h-4 w-4 text-emerald-600" />;
      case 'BILLING_READY':
        return <CreditCard className="h-4 w-4 text-indigo-600" />;
      case 'EMERGENCY_ALERT':
        return <ShieldAlert className="h-4 w-4 text-rose-600 animate-bounce" />;
      case 'PATIENT_STATUS_CHANGE':
        return <UserCheck className="h-4 w-4 text-blue-600" />;
      default:
        return <Zap className="h-4 w-4 text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return <Badge variant="danger" className="text-[10px] animate-pulse">EMERGENCY</Badge>;
      case 'HIGH':
        return <Badge variant="warning" className="text-[10px]">HIGH</Badge>;
      case 'NORMAL':
        return <Badge variant="teal" className="text-[10px]">NORMAL</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">INFO</Badge>;
    }
  };

  const handleSimulate = (type: NotificationType) => {
    appNotificationService.triggerPresetNotification(type);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-500/20 rounded-lg border border-teal-400/30">
              <Bell className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                Notification Center
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Real-time Patient & Hospital Alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Role Selector Bar */}
        <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 border-b border-slate-700">
          <span className="text-[11px] font-medium text-slate-400">Viewing Role Feed:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 text-white text-xs font-bold px-2.5 py-1 rounded-md border border-slate-600 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="PATIENT">Patient Notifications</option>
            <option value="DOCTOR">Doctor Notifications</option>
            <option value="NURSE">Nurse Notifications</option>
            <option value="PHARMACY">Pharmacy Notifications</option>
            <option value="ATTENDER">Attender Notifications</option>
            <option value="ADMIN">Admin Notifications</option>
            <option value="ALL">All System Roles</option>
          </select>
        </div>

        {/* Filter Tabs & Quick Actions */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'UNREAD'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setActiveTab('EMERGENCY')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'EMERGENCY'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Emergency
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => appNotificationService.markAllAsRead(roleFilter, currentMrn)}
              className="p-1.5 text-xs text-teal-700 hover:bg-teal-100 rounded-lg font-semibold flex items-center gap-1"
              title="Mark All Read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Read All</span>
            </button>
            <button
              onClick={() => setShowSimulatePanel(!showSimulatePanel)}
              className={`p-1.5 text-xs rounded-lg font-bold flex items-center gap-1 ${
                showSimulatePanel
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title="Simulate Event Triggers"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px]">Test Triggers</span>
            </button>
          </div>
        </div>

        {/* Test Notification Simulator Drawer Accordion */}
        {showSimulatePanel && (
          <div className="p-3 bg-purple-50 border-b border-purple-200 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-purple-900 flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Trigger Live Test Notification (All 9 Types):
              </span>
              <button
                onClick={() => setShowSimulatePanel(false)}
                className="text-purple-600 hover:text-purple-900 text-[10px] underline font-bold"
              >
                Hide
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleSimulate('APPOINTMENT_REMINDER')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                📅 Appointment Reminder
              </button>
              <button
                onClick={() => handleSimulate('TOKEN_APPROACHING')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                ⏱️ Token Approaching
              </button>
              <button
                onClick={() => handleSimulate('DOCTOR_DELAY')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                ⚠️ Doctor Delay
              </button>
              <button
                onClick={() => handleSimulate('QUEUE_DELAY')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                📊 Queue Bottleneck
              </button>
              <button
                onClick={() => handleSimulate('LAB_REPORT_READY')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                🧪 Lab Report Ready
              </button>
              <button
                onClick={() => handleSimulate('PHARMACY_READY')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                💊 Pharmacy Ready
              </button>
              <button
                onClick={() => handleSimulate('BILLING_READY')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                💳 Billing Ready
              </button>
              <button
                onClick={() => handleSimulate('PATIENT_STATUS_CHANGE')}
                className="p-1.5 bg-white border border-purple-200 hover:bg-purple-100 rounded text-left font-medium text-slate-800 text-[11px]"
              >
                🔄 Status Changed
              </button>
              <button
                onClick={() => handleSimulate('EMERGENCY_ALERT')}
                className="col-span-2 p-1.5 bg-rose-600 text-white rounded font-bold text-center text-[11px] shadow-xs hover:bg-rose-700"
              >
                🚨 EMERGENCY CODE RED ALERT
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No notifications in this view</p>
              <p className="text-[11px] text-slate-500 mt-1">
                New alerts will appear automatically when triggered.
              </p>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all text-xs relative ${
                  !item.isRead
                    ? 'bg-sky-50/70 border-sky-200 shadow-2xs'
                    : 'bg-white border-slate-200 opacity-80'
                } ${item.priority === 'EMERGENCY' ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        item.priority === 'EMERGENCY'
                          ? 'bg-rose-100 text-rose-700'
                          : !item.isRead
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {getIconForType(item.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        {item.title}
                        {!item.isRead && (
                          <span className="h-2 w-2 rounded-full bg-sky-600 shrink-0" />
                        )}
                      </h4>
                      {item.department && (
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          {item.department}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {getPriorityBadge(item.priority)}
                  </div>
                </div>

                <p className="text-slate-600 mt-2 text-[11px] leading-relaxed pl-7">
                  {item.message}
                </p>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 pl-7">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  <div className="flex items-center space-x-2">
                    {!item.isRead && (
                      <button
                        onClick={() => appNotificationService.markAsRead(item.id)}
                        className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-0.5"
                      >
                        <Check className="h-3 w-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                    {onNavigateTab && (
                      <button
                        onClick={() => {
                          onClose();
                          if (item.type === 'PHARMACY_READY') onNavigateTab('pharmacy');
                          else if (item.type === 'LAB_REPORT_READY') onNavigateTab('patient-dashboard');
                          else if (item.type === 'BILLING_READY') onNavigateTab('pharmacy');
                          else onNavigateTab('queue');
                        }}
                        className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Role Filter: {roleFilter}</span>
          <button
            onClick={() => appNotificationService.clearAll()}
            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Feed</span>
          </button>
        </div>
      </div>
    </div>
  );
}
