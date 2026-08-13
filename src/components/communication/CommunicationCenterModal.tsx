import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Pill,
  ShieldCheck,
  Users,
  Search,
  CheckCheck,
  Clock,
  AlertCircle,
  Paperclip,
  Sparkles,
  ChevronRight,
  Plus,
  Building2,
  PhoneCall
} from 'lucide-react';
import { messageService, ChatMessage, ConversationThread, CommunicationChannel } from '../../services/messageService';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { UserRole } from '../../types';

interface CommunicationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultChannel?: CommunicationChannel;
}

export function CommunicationCenterModal({
  isOpen,
  onClose,
  defaultChannel = 'DOCTOR_NURSE'
}: CommunicationCenterModalProps) {
  const { user } = useAuth();
  const currentUserRole: UserRole = user?.role || 'DOCTOR';
  const currentUserName = user?.name || 'Dr. Aris Vance';

  const [activeChannel, setActiveChannel] = useState<CommunicationChannel>(defaultChannel);
  const [threads, setThreads] = useState<ConversationThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [messagePriority, setMessagePriority] = useState<'NORMAL' | 'URGENT' | 'STAT'>('NORMAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);

  // New Thread Form fields
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadDesc, setNewThreadDesc] = useState('');
  const [newThreadPatientName, setNewThreadPatientName] = useState('John Doe');
  const [newThreadMrn, setNewThreadMrn] = useState('MRN-88291');

  useEffect(() => {
    const syncData = () => {
      const allThreads = messageService.getThreads();
      setThreads(allThreads);

      if (!selectedThreadId && allThreads.length > 0) {
        const matchingChannel = allThreads.find((t) => t.channel === activeChannel);
        if (matchingChannel) {
          setSelectedThreadId(matchingChannel.id);
        } else {
          setSelectedThreadId(allThreads[0].id);
        }
      }
    };

    syncData();
    const unsubscribe = messageService.subscribe(syncData);
    return () => unsubscribe();
  }, [activeChannel, selectedThreadId]);

  useEffect(() => {
    if (selectedThreadId) {
      const threadMsgs = messageService.getMessagesForThread(selectedThreadId);
      setMessages(threadMsgs);
      messageService.markThreadAsRead(selectedThreadId);
    }
  }, [selectedThreadId]);

  if (!isOpen) return null;

  const currentThread = threads.find((t) => t.id === selectedThreadId);

  const filteredThreads = threads.filter((t) => {
    const matchesChannel = t.channel === activeChannel;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !selectedThreadId) return;

    messageService.sendMessage(
      selectedThreadId,
      currentUserName,
      currentUserRole,
      newMessageText.trim(),
      messagePriority,
      currentThread?.patientContext?.mrn,
      currentThread?.patientContext?.name
    );

    setNewMessageText('');
    setMessagePriority('NORMAL');
  };

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadTitle.trim()) return;

    const participants = [
      { name: currentUserName, role: currentUserRole },
      { name: 'Duty Recipient', role: getRecipientRoleForChannel(activeChannel) }
    ];

    const thread = messageService.createNewThread(
      activeChannel,
      newThreadTitle,
      newThreadDesc || 'Clinical coordination channel',
      participants,
      { name: newThreadPatientName, mrn: newThreadMrn, location: 'General OPD Desk' }
    );

    setSelectedThreadId(thread.id);
    setShowNewThreadModal(false);
    setNewThreadTitle('');
    setNewThreadDesc('');
  };

  function getRecipientRoleForChannel(channel: CommunicationChannel): UserRole {
    switch (channel) {
      case 'DOCTOR_NURSE':
        return 'NURSE';
      case 'DOCTOR_PHARMACY':
        return 'PHARMACY';
      case 'PATIENT_STAFF':
        return 'ATTENDER';
      case 'ADMIN_STAFF':
        return 'DOCTOR';
      default:
        return 'NURSE';
    }
  }

  const getPresetChipsForChannel = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'DOCTOR_NURSE':
        return [
          'Please re-check vitals in 15 mins.',
          'Administer IV fluids stat.',
          'Patient approved for ward transfer.',
          'Bedside consultation completed.'
        ];
      case 'DOCTOR_PHARMACY':
        return [
          'Substitute approved as suggested.',
          'Verifying dosage with clinical chart.',
          'Prescription expedited for express pickup.',
          'Please confirm drug allergy history.'
        ];
      case 'PATIENT_STAFF':
        return [
          'Wheelchair attender dispatched to entrance.',
          'Your token is expected in ~10 mins.',
          'Laboratory reports ready at Desk 2.',
          'Staff member will guide you to Ward.'
        ];
      case 'ADMIN_STAFF':
        return [
          'OPD Counter 4 activated for surge relief.',
          'Shift handover meeting in 10 mins.',
          'Trauma team on standby.',
          'System sync completed.'
        ];
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'DOCTOR':
        return <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />;
      case 'NURSE':
        return <HeartPulse className="h-3.5 w-3.5 text-rose-600" />;
      case 'PHARMACY':
        return <Pill className="h-3.5 w-3.5 text-emerald-600" />;
      case 'ATTENDER':
        return <Users className="h-3.5 w-3.5 text-teal-600" />;
      case 'ADMIN':
        return <ShieldCheck className="h-3.5 w-3.5 text-slate-800" />;
      default:
        return <UserCheck className="h-3.5 w-3.5 text-sky-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 rounded-xl border border-teal-400/30 text-teal-400">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
                Hospital Secure Communication Center
                <Badge variant="teal" className="text-[10px]">
                  Real-time Sync
                </Badge>
              </h2>
              <p className="text-xs text-slate-400">
                Inter-Departmental Messaging & Clinical Handoff Channels
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Channel Selector Bar */}
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2 overflow-x-auto text-xs border-b border-slate-700">
          <button
            onClick={() => setActiveChannel('DOCTOR_NURSE')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeChannel === 'DOCTOR_NURSE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Doctor ↔ Nurse</span>
          </button>

          <button
            onClick={() => setActiveChannel('DOCTOR_PHARMACY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeChannel === 'DOCTOR_PHARMACY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Pill className="h-3.5 w-3.5" />
            <span>Doctor ↔ Pharmacy</span>
          </button>

          <button
            onClick={() => setActiveChannel('PATIENT_STAFF')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeChannel === 'PATIENT_STAFF'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Patient ↔ Hospital Staff</span>
          </button>

          <button
            onClick={() => setActiveChannel('ADMIN_STAFF')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeChannel === 'ADMIN_STAFF'
                ? 'bg-slate-900 text-white border border-slate-600 shadow-xs'
                : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span>Admin ↔ Staff</span>
          </button>
        </div>

        {/* Main Split Body: Sidebar Threads + Conversation Thread */}
        <div className="flex-1 flex overflow-hidden">
          {/* Threads Sidebar */}
          <div className="w-full sm:w-80 bg-slate-50 border-r border-slate-200 flex flex-col">
            <div className="p-3 border-b border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Active Channels
                </span>
                <button
                  onClick={() => setShowNewThreadModal(true)}
                  className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>New Channel</span>
                </button>
              </div>

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search threads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* List of Threads */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredThreads.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No active threads in this channel.
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = thread.id === selectedThreadId;
                  return (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThreadId(thread.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-teal-500 shadow-sm ring-1 ring-teal-400'
                          : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[180px]">
                          {thread.title}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1">
                        {thread.lastMessage}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        {thread.patientContext && (
                          <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                            {thread.patientContext.mrn}
                          </span>
                        )}
                        <span>
                          {new Date(thread.lastMessageTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Conversation Main View */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {currentThread ? (
              <>
                {/* Thread Header */}
                <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      {currentThread.title}
                    </h3>
                    <p className="text-xs text-slate-500">{currentThread.description}</p>
                  </div>

                  {currentThread.patientContext && (
                    <div className="hidden sm:flex items-center space-x-2 bg-teal-50 border border-teal-200 p-1.5 px-3 rounded-xl">
                      <UserCheck className="h-4 w-4 text-teal-700" />
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-slate-900">
                          {currentThread.patientContext.name}
                        </div>
                        <div className="text-[10px] text-teal-700 font-mono font-bold">
                          {currentThread.patientContext.mrn} &bull; {currentThread.patientContext.location}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {messages.map((msg) => {
                    const isSelf = msg.senderRole === currentUserRole;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center space-x-1.5 mb-1 text-[10px] text-slate-500 font-semibold">
                          <span className="flex items-center gap-1 text-slate-700">
                            {getRoleIcon(msg.senderRole)}
                            {msg.senderName}
                          </span>
                          <span>&bull;</span>
                          <span className="uppercase text-teal-700 font-bold">{msg.senderRole}</span>
                          <span>&bull;</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                            isSelf
                              ? 'bg-sky-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                          } ${msg.priority === 'STAT' ? 'ring-2 ring-rose-500 bg-rose-50 text-rose-900 border-rose-300' : ''}`}
                        >
                          {msg.priority === 'STAT' && (
                            <div className="font-extrabold uppercase text-[10px] text-rose-700 mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 text-rose-600 animate-pulse" />
                              STAT HIGH PRIORITY ORDER
                            </div>
                          )}

                          <p>{msg.body}</p>

                          {msg.attachmentName && (
                            <div className="mt-2 p-1.5 bg-black/10 rounded-lg text-[10px] font-mono flex items-center gap-1.5">
                              <Paperclip className="h-3 w-3" />
                              <span>{msg.attachmentName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Preset Quick Chips */}
                <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                  <span className="text-slate-500 font-bold shrink-0 pl-1">Quick Responses:</span>
                  {getPresetChipsForChannel(activeChannel).map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewMessageText(chip)}
                      className="bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-300 px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
                >
                  <select
                    value={messagePriority}
                    onChange={(e: any) => setMessagePriority(e.target.value)}
                    className="bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold px-2 py-2 rounded-xl focus:outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="STAT">STAT Emergency</option>
                  </select>

                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type clinical order or message..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />

                  <button
                    type="submit"
                    disabled={!newMessageText.trim()}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition-all shadow-xs"
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <MessageSquare className="h-12 w-12 text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-600">No Thread Selected</p>
                <p className="text-xs text-slate-400">Select a channel thread on the left or create a new channel.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                Create New {activeChannel.replace('_', ' ↔ ')} Channel
              </h3>
              <button onClick={() => setShowNewThreadModal(false)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Channel Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed 302 Post-Op Consultation"
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Channel Description</label>
                <input
                  type="text"
                  placeholder="e.g. Post-op recovery & medication check"
                  value={newThreadDesc}
                  onChange={(e) => setNewThreadDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={newThreadPatientName}
                    onChange={(e) => setNewThreadPatientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Patient MRN</label>
                  <input
                    type="text"
                    value={newThreadMrn}
                    onChange={(e) => setNewThreadMrn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
