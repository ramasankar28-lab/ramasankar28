import { UserRole } from '../types';

export type NotificationType =
  | 'APPOINTMENT_REMINDER'
  | 'TOKEN_APPROACHING'
  | 'DOCTOR_DELAY'
  | 'QUEUE_DELAY'
  | 'LAB_REPORT_READY'
  | 'PHARMACY_READY'
  | 'BILLING_READY'
  | 'EMERGENCY_ALERT'
  | 'PATIENT_STATUS_CHANGE'
  | 'SYSTEM_ALERT';

export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'EMERGENCY';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetRole: UserRole | 'ALL';
  targetUserId?: string;
  targetMrn?: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  department?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'smart_hospital_notifications_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Emergency Trauma Code Blue',
    message: 'Trauma Bay 2 requires immediate Senior Anesthesiologist & Emergency Team!',
    type: 'EMERGENCY_ALERT',
    priority: 'EMERGENCY',
    targetRole: 'ALL',
    department: 'Emergency 24/7',
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-2',
    title: 'Token Approaching Notice',
    message: 'Token #OPD-104 (Mr. Rajesh Kumar) is only 2 positions away in General OPD Room 102.',
    type: 'TOKEN_APPROACHING',
    priority: 'HIGH',
    targetRole: 'PATIENT',
    targetMrn: 'MRN-88291',
    department: 'General OPD',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-3',
    title: 'Doctor Delay Advisory',
    message: 'Dr. Aris Vance is currently attending an emergency consult. OPD Room 102 delayed by ~15 mins.',
    type: 'DOCTOR_DELAY',
    priority: 'NORMAL',
    targetRole: 'PATIENT',
    department: 'General OPD',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-4',
    title: 'Lab Report Completed',
    message: 'Complete Blood Count (CBC) & Lipid Panel for Sarah Jenkins (MRN-92014) is now available.',
    type: 'LAB_REPORT_READY',
    priority: 'NORMAL',
    targetRole: 'PATIENT',
    targetMrn: 'MRN-92014',
    department: 'Laboratory',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-5',
    title: 'Prescription Ready for Pickup',
    message: 'Prescription #RX-9902 for Token #PH-204 is prepared at Express Counter 2.',
    type: 'PHARMACY_READY',
    priority: 'NORMAL',
    targetRole: 'PHARMACY',
    department: 'Pharmacy',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-6',
    title: 'Billing Invoice Generated',
    message: 'Final Discharge Invoice #INV-8812 is generated. Amount $245.00 ready for payment.',
    type: 'BILLING_READY',
    priority: 'NORMAL',
    targetRole: 'PATIENT',
    department: 'Billing',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 'notif-7',
    title: 'Patient Status Changed',
    message: 'Patient Emily Davis (Bed 302-A) status updated from "In Recovery" to "Discharge Cleared".',
    type: 'PATIENT_STATUS_CHANGE',
    priority: 'HIGH',
    targetRole: 'ATTENDER',
    department: 'Ward 3',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-8',
    title: 'Appointment Reminder',
    message: 'Upcoming Follow-up Appointment with Dr. Sarah Jenkins tomorrow at 09:30 AM.',
    type: 'APPOINTMENT_REMINDER',
    priority: 'NORMAL',
    targetRole: 'PATIENT',
    department: 'Cardiology OPD',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: true
  },
  {
    id: 'notif-9',
    title: 'Queue Bottleneck Warning',
    message: 'OPD Queue length exceeds 80 patients. System recommends opening Counter 4.',
    type: 'QUEUE_DELAY',
    priority: 'HIGH',
    targetRole: 'ADMIN',
    department: 'OPD',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    isRead: false
  },
  {
    id: 'notif-10',
    title: 'Critical Vitals Alert',
    message: 'Patient Robert Wilson (Bed 104) SpO2 dropped below 90% (88%). Nurse attention required.',
    type: 'EMERGENCY_ALERT',
    priority: 'EMERGENCY',
    targetRole: 'NURSE',
    department: 'ICU Ward',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    isRead: false
  }
];

class NotificationService {
  private notifications: AppNotification[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        this.notifications = JSON.parse(stored);
      } else {
        this.notifications = INITIAL_NOTIFICATIONS;
        this.saveToStorage();
      }
    } catch {
      this.notifications = INITIAL_NOTIFICATIONS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(this.notifications));
    } catch {
      // ignore storage errors
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  public getNotificationsForRole(role: UserRole | string, mrn?: string): AppNotification[] {
    return this.notifications.filter((n) => {
      if (n.targetRole === 'ALL') return true;
      if (n.targetRole === role) return true;
      if (mrn && n.targetMrn === mrn) return true;

      // Role specific rules as defined in prompt
      if (role === 'DOCTOR' && (n.type === 'EMERGENCY_ALERT' || n.type === 'LAB_REPORT_READY' || n.type === 'TOKEN_APPROACHING')) return true;
      if (role === 'NURSE' && (n.type === 'EMERGENCY_ALERT' || n.type === 'PATIENT_STATUS_CHANGE' || n.type === 'DOCTOR_DELAY')) return true;
      if (role === 'PHARMACY' && (n.type === 'PHARMACY_READY' || n.type === 'EMERGENCY_ALERT')) return true;
      if (role === 'ATTENDER' && (n.type === 'PATIENT_STATUS_CHANGE' || n.type === 'TOKEN_APPROACHING' || n.type === 'QUEUE_DELAY')) return true;
      if (role === 'ADMIN' && (n.type === 'SYSTEM_ALERT' || n.type === 'EMERGENCY_ALERT' || n.type === 'QUEUE_DELAY')) return true;

      return false;
    });
  }

  public getUnreadCount(role: UserRole | string, mrn?: string): number {
    return this.getNotificationsForRole(role, mrn).filter((n) => !n.isRead).length;
  }

  public getEmergencyAlerts(): AppNotification[] {
    return this.notifications.filter((n) => n.priority === 'EMERGENCY' && !n.isRead);
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    this.saveToStorage();
  }

  public markAllAsRead(role: UserRole | string, mrn?: string) {
    const roleNotifs = new Set(this.getNotificationsForRole(role, mrn).map((n) => n.id));
    this.notifications = this.notifications.map((n) => (roleNotifs.has(n.id) ? { ...n, isRead: true } : n));
    this.saveToStorage();
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>): AppNotification {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    this.notifications = [newNotif, ...this.notifications];
    this.saveToStorage();
    return newNotif;
  }

  public triggerPresetNotification(type: NotificationType): AppNotification {
    const presets: Record<NotificationType, Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>> = {
      APPOINTMENT_REMINDER: {
        title: 'Appointment Reminder',
        message: 'Reminder: Your consultation with Dr. Aris Vance is scheduled in 30 minutes.',
        type: 'APPOINTMENT_REMINDER',
        priority: 'NORMAL',
        targetRole: 'PATIENT',
        department: 'General OPD'
      },
      TOKEN_APPROACHING: {
        title: 'Token Approaching!',
        message: 'Your token #OPD-108 is now next in line. Please proceed to Desk 3.',
        type: 'TOKEN_APPROACHING',
        priority: 'HIGH',
        targetRole: 'PATIENT',
        department: 'OPD'
      },
      DOCTOR_DELAY: {
        title: 'Doctor Delay Alert',
        message: 'Dr. Jenkins is delayed due to an emergency procedure. Estimated delay: 20 mins.',
        type: 'DOCTOR_DELAY',
        priority: 'NORMAL',
        targetRole: 'PATIENT',
        department: 'Cardiology'
      },
      QUEUE_DELAY: {
        title: 'Queue Bottleneck Detected',
        message: 'Pharmacy queue experiencing high volume (~25 mins wait). Express counter activated.',
        type: 'QUEUE_DELAY',
        priority: 'HIGH',
        targetRole: 'ADMIN',
        department: 'Pharmacy'
      },
      LAB_REPORT_READY: {
        title: 'Lab Report Published',
        message: 'Your Diagnostic Blood & Urine Analysis report is ready to view & download.',
        type: 'LAB_REPORT_READY',
        priority: 'NORMAL',
        targetRole: 'PATIENT',
        department: 'Laboratory'
      },
      PHARMACY_READY: {
        title: 'Prescription Ready for Pickup',
        message: 'Medication order #RX-7712 is ready at Pharmacy Counter 3.',
        type: 'PHARMACY_READY',
        priority: 'NORMAL',
        targetRole: 'PHARMACY',
        department: 'Pharmacy'
      },
      BILLING_READY: {
        title: 'Billing Receipt Issued',
        message: 'Invoice #INV-9041 for OPD consultation is generated. Tap to view payment breakdown.',
        type: 'BILLING_READY',
        priority: 'NORMAL',
        targetRole: 'PATIENT',
        department: 'Billing'
      },
      EMERGENCY_ALERT: {
        title: 'EMERGENCY CODE RED',
        message: 'Code Red triggered in ICU Block B! All available Nursing & Medical staff report immediately.',
        type: 'EMERGENCY_ALERT',
        priority: 'EMERGENCY',
        targetRole: 'ALL',
        department: 'ICU Ward'
      },
      PATIENT_STATUS_CHANGE: {
        title: 'Patient Status Updated',
        message: 'Patient John Doe (MRN-88291) transferred from Triage to Observation Room 102.',
        type: 'PATIENT_STATUS_CHANGE',
        priority: 'HIGH',
        targetRole: 'ATTENDER',
        department: 'Emergency'
      },
      SYSTEM_ALERT: {
        title: 'System Performance Notice',
        message: 'Automatic OPD Token dispatch algorithm synchronized across all 8 counters.',
        type: 'SYSTEM_ALERT',
        priority: 'LOW',
        targetRole: 'ADMIN',
        department: 'IT Admin'
      }
    };

    return this.addNotification(presets[type]);
  }

  public clearAll() {
    this.notifications = [];
    this.saveToStorage();
  }
}

export const appNotificationService = new NotificationService();
