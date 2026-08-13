import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, X, ArrowRight, Volume2 } from 'lucide-react';
import { appNotificationService, AppNotification } from '../../services/notificationService';
import { useAuth } from '../../context/AuthContext';

export function PriorityAlertBanner() {
  const { user } = useAuth();
  const [emergencyAlerts, setEmergencyAlerts] = useState<AppNotification[]>([]);

  useEffect(() => {
    const updateAlerts = () => {
      const alerts = appNotificationService.getEmergencyAlerts();
      setEmergencyAlerts(alerts);
    };

    updateAlerts();
    const unsubscribe = appNotificationService.subscribe(updateAlerts);
    return () => unsubscribe();
  }, []);

  if (emergencyAlerts.length === 0) return null;

  const currentAlert = emergencyAlerts[0];

  const handleDismiss = (id: string) => {
    appNotificationService.markAsRead(id);
  };

  return (
    <div className="bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-b-2 border-rose-800 shadow-lg px-4 py-2.5 z-50 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
            <ShieldAlert className="h-5 w-5 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold uppercase bg-black/40 px-2 py-0.5 rounded text-[10px] tracking-wider text-amber-300">
                CRITICAL PRIORITY ALERT
              </span>
              <span className="font-bold text-white text-sm">{currentAlert.title}</span>
            </div>
            <p className="text-rose-100 font-medium mt-0.5">{currentAlert.message}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => handleDismiss(currentAlert.id)}
            className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg font-extrabold transition-all cursor-pointer shadow-sm flex items-center space-x-1"
          >
            <span>Acknowledge & Dismiss</span>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
