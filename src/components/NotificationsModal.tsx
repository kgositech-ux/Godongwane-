import React, { useState } from 'react';
import {
  X,
  Bell,
  Check,
  CheckCheck,
  AlertCircle,
  Clock,
  Send,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { AppNotification } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSendForm, setShowSendForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('all');
  const [notifType, setNotifType] = useState<AppNotification['type']>('status_update');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), { read: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter((n) => !n.read).forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notifications');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);

    try {
      const newNotif: Omit<AppNotification, 'id'> = {
        recipientEmail: recipient.trim(),
        title: title.trim(),
        message: message.trim(),
        type: notifType,
        read: false,
        createdAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'notifications'), newNotif);
      setTitle('');
      setMessage('');
      setShowSendForm(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notifications');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Automated Notifications</h2>
              <p className="text-xs text-slate-400">
                Godongwane Project Progress & Milestone Alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'unread' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowSendForm(!showSendForm)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {showSendForm ? 'Cancel Alert' : '+ Send Alert'}
              </button>
            )}
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          </div>
        </div>

        {/* New Alert Form */}
        {showSendForm && (
          <form onSubmit={handleSendNotification} className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast Project Progress Alert</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="Alert Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="status_update">Status Update</option>
                <option value="task_assigned">Task Assignment</option>
                <option value="milestone_completed">Milestone Completed</option>
                <option value="system">System Notice</option>
              </select>
            </div>
            <textarea
              required
              rows={2}
              placeholder="Notification details for collaborators..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              <span>{sending ? 'Sending...' : 'Publish Notification'}</span>
            </button>
          </form>
        )}

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p>No notifications matching current filter.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-xl border text-xs transition-all ${
                  notif.read
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-400'
                    : 'bg-slate-900/90 border-amber-500/30 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {notif.type === 'milestone_completed' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {notif.type === 'task_assigned' && (
                      <Flag className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    )}
                    {notif.type === 'status_update' && (
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    {notif.type === 'system' && (
                      <AlertCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-100">{notif.title}</span>
                  </div>
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5 shrink-0"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>
                <p className="text-slate-300 leading-relaxed">{notif.message}</p>
                <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                  <span>{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>•</span>
                  <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
