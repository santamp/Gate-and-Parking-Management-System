import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketContext';

const typeStyles = {
  vehicle_entry: 'bg-blue-50 text-blue-700 border-blue-100',
  vehicle_status: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  payment: 'bg-teal-50 text-teal-700 border-teal-100',
  exit: 'bg-amber-50 text-amber-700 border-amber-100',
  system: 'bg-gray-50 text-gray-700 border-gray-100',
};

const formatTime = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const NotificationPanel = ({ notificationPath = 'notifications', tone = 'indigo' }) => {
  const socket = useSocket();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toneClasses = tone === 'amber'
    ? 'hover:text-amber-600 hover:bg-amber-50 text-gray-400'
    : 'hover:text-indigo-600 hover:bg-indigo-50 text-gray-400';

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ limit: 8 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev.filter((item) => item._id !== notification._id)].slice(0, 8));
      setUnreadCount((count) => count + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkOne = async (notification) => {
    if (notification.isRead) return;
    await notificationService.markRead(notification._id);
    setNotifications((prev) => prev.map((item) => (
      item._id === notification._id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`relative p-2 rounded-lg transition-colors ${toneClasses}`}
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-20 max-h-[calc(100dvh-6rem)] bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-[min(22rem,calc(100vw-2rem))] sm:max-h-none">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
              <p className="text-[11px] text-gray-400 font-semibold">{unreadCount} unread</p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Mark all read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100dvh-14rem)] overflow-y-auto sm:max-h-96">
            {loading ? (
              <div className="py-10 flex justify-center text-gray-400">
                <Loader2 size={22} className="animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleMarkOne(notification)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notification.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.isRead ? 'bg-gray-200' : 'bg-rose-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">{notification.title}</p>
                        <span className="text-[10px] font-semibold text-gray-400 shrink-0">{formatTime(notification.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                      <span className={`inline-flex mt-2 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${typeStyles[notification.type] || typeStyles.system}`}>
                        {notification.type?.replace('_', ' ') || 'system'}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-bold text-gray-700">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">New gate activity will appear here.</p>
              </div>
            )}
          </div>

          <Link
            to={notificationPath}
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-center text-xs font-bold text-gray-700 hover:bg-gray-50 border-t border-gray-100"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
