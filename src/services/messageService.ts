import { UserRole } from '../types';

export type CommunicationChannel = 'DOCTOR_NURSE' | 'DOCTOR_PHARMACY' | 'PATIENT_STAFF' | 'ADMIN_STAFF';

export interface ChatMessage {
  id: string;
  threadId: string;
  channel: CommunicationChannel;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  receiverRole: UserRole;
  subject?: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  priority?: 'NORMAL' | 'URGENT' | 'STAT';
  patientMrn?: string;
  patientName?: string;
  attachmentName?: string;
}

export interface ConversationThread {
  id: string;
  channel: CommunicationChannel;
  title: string;
  description: string;
  participants: { name: string; role: UserRole; avatarBg?: string }[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  patientContext?: { name: string; mrn: string; location: string };
}

const MESSAGES_STORAGE_KEY = 'smart_hospital_chat_messages_v1';

const INITIAL_THREADS: ConversationThread[] = [
  {
    id: 'thread-doc-nurse-1',
    channel: 'DOCTOR_NURSE',
    title: 'Dr. Aris Vance ↔ Nurse Sarah Jenkins',
    description: 'Bedside Vitals & Stat Medication Orders',
    participants: [
      { name: 'Dr. Aris Vance', role: 'DOCTOR', avatarBg: 'bg-indigo-600' },
      { name: 'Nurse Sarah Jenkins', role: 'NURSE', avatarBg: 'bg-rose-600' }
    ],
    lastMessage: 'Vitals re-checked for Bed 102. BP is now 125/82 mmHg, SpO2 98%.',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    unreadCount: 1,
    patientContext: { name: 'John Doe', mrn: 'MRN-88291', location: 'Observation Room 102' }
  },
  {
    id: 'thread-doc-pharm-1',
    channel: 'DOCTOR_PHARMACY',
    title: 'Dr. Aris Vance ↔ Pharmacist David Miller',
    description: 'Prescription Substitute & Dosage Verification',
    participants: [
      { name: 'Dr. Aris Vance', role: 'DOCTOR', avatarBg: 'bg-indigo-600' },
      { name: 'Pharmacist David Miller', role: 'PHARMACY', avatarBg: 'bg-emerald-600' }
    ],
    lastMessage: 'Amoxicillin 500mg batch available. Can we issue 250mg dispersible tabs?',
    lastMessageTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    unreadCount: 2,
    patientContext: { name: 'Sarah Jenkins', mrn: 'MRN-92014', location: 'OPD Desk 102' }
  },
  {
    id: 'thread-pat-staff-1',
    channel: 'PATIENT_STAFF',
    title: 'Patient Rajesh Kumar ↔ Hospital Help Desk',
    description: 'Wheelchair Assistance & OPD Token Inquiry',
    participants: [
      { name: 'Rajesh Kumar', role: 'PATIENT', avatarBg: 'bg-sky-600' },
      { name: 'Staff SupportDesk', role: 'ATTENDER', avatarBg: 'bg-teal-600' }
    ],
    lastMessage: 'Our attender is reaching Main Entrance with a ramp wheelchair now.',
    lastMessageTime: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    unreadCount: 0,
    patientContext: { name: 'Rajesh Kumar', mrn: 'MRN-88291', location: 'Main Entrance Lobby' }
  },
  {
    id: 'thread-admin-staff-1',
    channel: 'ADMIN_STAFF',
    title: 'Hospital Admin Command ↔ All Shift Staff',
    description: 'Emergency Surge Broadcast & Shift Directives',
    participants: [
      { name: 'Admin Command', role: 'ADMIN', avatarBg: 'bg-slate-900' },
      { name: 'Duty Doctors & Nurses', role: 'DOCTOR', avatarBg: 'bg-purple-600' }
    ],
    lastMessage: 'High surge expected in General OPD around 10:30 AM. Activate Express Counter 4.',
    lastMessageTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    unreadCount: 0
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  // Thread 1 messages (Doc-Nurse)
  {
    id: 'msg-1',
    threadId: 'thread-doc-nurse-1',
    channel: 'DOCTOR_NURSE',
    senderId: 'usr-doc-1',
    senderName: 'Dr. Aris Vance',
    senderRole: 'DOCTOR',
    receiverId: 'usr-nurse-1',
    receiverName: 'Nurse Sarah Jenkins',
    receiverRole: 'NURSE',
    body: 'Nurse Sarah, please administer IV Paracetamol 100ml for John Doe in Bed 102 and re-check blood pressure.',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'URGENT',
    patientMrn: 'MRN-88291',
    patientName: 'John Doe'
  },
  {
    id: 'msg-2',
    threadId: 'thread-doc-nurse-1',
    channel: 'DOCTOR_NURSE',
    senderId: 'usr-nurse-1',
    senderName: 'Nurse Sarah Jenkins',
    senderRole: 'NURSE',
    receiverId: 'usr-doc-1',
    receiverName: 'Dr. Aris Vance',
    receiverRole: 'DOCTOR',
    body: 'IV Paracetamol administered at 08:20 AM. Patient resting comfortably.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'NORMAL',
    patientMrn: 'MRN-88291',
    patientName: 'John Doe'
  },
  {
    id: 'msg-3',
    threadId: 'thread-doc-nurse-1',
    channel: 'DOCTOR_NURSE',
    senderId: 'usr-nurse-1',
    senderName: 'Nurse Sarah Jenkins',
    senderRole: 'NURSE',
    receiverId: 'usr-doc-1',
    receiverName: 'Dr. Aris Vance',
    receiverRole: 'DOCTOR',
    body: 'Vitals re-checked for Bed 102. BP is now 125/82 mmHg, SpO2 98%.',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'NORMAL',
    patientMrn: 'MRN-88291',
    patientName: 'John Doe'
  },

  // Thread 2 messages (Doc-Pharm)
  {
    id: 'msg-4',
    threadId: 'thread-doc-pharm-1',
    channel: 'DOCTOR_PHARMACY',
    senderId: 'usr-pharm-1',
    senderName: 'Pharmacist David Miller',
    senderRole: 'PHARMACY',
    receiverId: 'usr-doc-1',
    receiverName: 'Dr. Aris Vance',
    receiverRole: 'DOCTOR',
    body: 'Dr. Vance, for prescription RX-9902 (Sarah Jenkins), Amoxicillin 500mg capsules are out of stock. Can we issue 250mg dispersible tabs?',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    isRead: false,
    priority: 'NORMAL',
    patientMrn: 'MRN-92014',
    patientName: 'Sarah Jenkins'
  },

  // Thread 3 messages (Patient-Staff)
  {
    id: 'msg-5',
    threadId: 'thread-pat-staff-1',
    channel: 'PATIENT_STAFF',
    senderId: 'usr-pat-1',
    senderName: 'Rajesh Kumar',
    senderRole: 'PATIENT',
    receiverId: 'usr-attender-1',
    receiverName: 'Staff SupportDesk',
    receiverRole: 'ATTENDER',
    body: 'Hello, I have arrived at the Main Entrance. My elderly father needs a wheelchair assistance to reach OPD Room 102.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: true,
    patientMrn: 'MRN-88291'
  },
  {
    id: 'msg-6',
    threadId: 'thread-pat-staff-1',
    channel: 'PATIENT_STAFF',
    senderId: 'usr-attender-1',
    senderName: 'Staff SupportDesk',
    senderRole: 'ATTENDER',
    receiverId: 'usr-pat-1',
    receiverName: 'Rajesh Kumar',
    receiverRole: 'PATIENT',
    body: 'Our attender is reaching Main Entrance with a ramp wheelchair now.',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    isRead: true,
    patientMrn: 'MRN-88291'
  },

  // Thread 4 messages (Admin-Staff)
  {
    id: 'msg-7',
    threadId: 'thread-admin-staff-1',
    channel: 'ADMIN_STAFF',
    senderId: 'usr-admin-1',
    senderName: 'Admin Command',
    senderRole: 'ADMIN',
    receiverId: 'usr-all-staff',
    receiverName: 'Duty Doctors & Nurses',
    receiverRole: 'DOCTOR',
    body: 'Attention all staff: High surge expected in General OPD around 10:30 AM. Activate Express Counter 4.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isRead: true,
    priority: 'STAT'
  }
];

class MessageService {
  private threads: ConversationThread[] = [];
  private messages: ChatMessage[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (storedMsgs) {
        const parsed = JSON.parse(storedMsgs);
        this.messages = parsed.messages || INITIAL_MESSAGES;
        this.threads = parsed.threads || INITIAL_THREADS;
      } else {
        this.messages = INITIAL_MESSAGES;
        this.threads = INITIAL_THREADS;
        this.saveToStorage();
      }
    } catch {
      this.messages = INITIAL_MESSAGES;
      this.threads = INITIAL_THREADS;
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(
        MESSAGES_STORAGE_KEY,
        JSON.stringify({ messages: this.messages, threads: this.threads })
      );
    } catch {
      // ignore
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

  public getThreads(channelFilter?: CommunicationChannel): ConversationThread[] {
    if (!channelFilter) return this.threads;
    return this.threads.filter((t) => t.channel === channelFilter);
  }

  public getMessagesForThread(threadId: string): ChatMessage[] {
    return this.messages.filter((m) => m.threadId === threadId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public getUnreadMessagesCount(role?: UserRole): number {
    return this.messages.filter((m) => !m.isRead).length;
  }

  public sendMessage(
    threadId: string,
    senderName: string,
    senderRole: UserRole,
    body: string,
    priority: 'NORMAL' | 'URGENT' | 'STAT' = 'NORMAL',
    patientMrn?: string,
    patientName?: string,
    attachmentName?: string
  ): ChatMessage {
    const thread = this.threads.find((t) => t.id === threadId);
    const channel = thread ? thread.channel : 'DOCTOR_NURSE';

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      threadId,
      channel,
      senderId: `usr-${senderRole.toLowerCase()}`,
      senderName,
      senderRole,
      receiverId: 'usr-recipient',
      receiverName: thread?.title || 'Recipient',
      receiverRole: 'NURSE',
      body,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority,
      patientMrn,
      patientName,
      attachmentName
    };

    this.messages = [...this.messages, newMessage];

    // Update thread summary
    if (thread) {
      thread.lastMessage = body;
      thread.lastMessageTime = newMessage.timestamp;
      thread.unreadCount += 1;
    }

    this.saveToStorage();
    return newMessage;
  }

  public createNewThread(
    channel: CommunicationChannel,
    title: string,
    description: string,
    participants: { name: string; role: UserRole; avatarBg?: string }[],
    patientContext?: { name: string; mrn: string; location: string }
  ): ConversationThread {
    const newThread: ConversationThread = {
      id: `thread-${Date.now()}`,
      channel,
      title,
      description,
      participants,
      lastMessage: 'Conversation initialized.',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      patientContext
    };

    this.threads = [newThread, ...this.threads];
    this.saveToStorage();
    return newThread;
  }

  public markThreadAsRead(threadId: string) {
    this.messages = this.messages.map((m) => (m.threadId === threadId ? { ...m, isRead: true } : m));
    this.threads = this.threads.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t));
    this.saveToStorage();
  }
}

export const messageService = new MessageService();
