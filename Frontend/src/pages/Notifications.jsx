import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import notificationService from '../services/notificationService';
import { useSocket } from '../context/SocketContext';

const badgeStyles = {
  vehicle_entry: 'bg-blue-50 text-blue-700 border-blue-100',
  vehicle_status: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  payment: 'bg-teal-50 text-teal-700 border-teal-100',
  exit: 'bg-amber-50 text-amber-700 border-amber-100',
  system: 'bg-gray-50 text-gray-700 border-gray-100',
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const Notifications = () => {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchNotifications = useCallback(async (nextPage = 1) => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({ page: nextPage, limit: 20 });
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
      setPage(res.page || nextPage);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleNewNotification = (notification) => {
      setNotifications((prev) => page === 1 ? [notification, ...prev.filter((item) => item._id !== notification._id)].slice(0, 20) : prev);
      setUnreadCount((count) => count + 1);
    };

    socket.on('notification:new', handleNewNotification);
    return () => socket.off('notification:new', handleNewNotification);
  }, [socket, page]);

  const markOneRead = async (notification) => {
    if (notification.isRead) return;
    await notificationService.markRead(notification._id);
    setNotifications((prev) => prev.map((item) => (
      item._id === notification._id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item
    )));
    setUnreadCount((count) => Math.max(0, count - 1));
  };

  const markAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
              <p className="text-gray-500 font-medium mt-1 text-xs">Gate updates, approvals, payments and exits in one place</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-600">
            {unreadCount} unread
          </span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
          <button onClick={() => fetchNotifications(page)} className="p-2 rounded-lg bg-gray-900 text-white hover:bg-black" title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex justify-center text-gray-400">
            <Loader2 size={28} className="animate-spin" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              onClick={() => markOneRead(notification)}
              className={`w-full text-left px-5 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${notification.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
            >
              <div className="flex gap-4">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${notification.isRead ? 'bg-gray-200' : 'bg-rose-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{notification.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">{notification.message}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 shrink-0">{formatDate(notification.createdAt)}</span>
                  </div>
                  <span className={`inline-flex mt-3 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${badgeStyles[notification.type] || badgeStyles.system}`}>
                    {notification.type?.replace('_', ' ') || 'system'}
                  </span>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="px-6 py-20 text-center">
            <Bell size={36} className="mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-bold text-gray-900">No notifications yet</h3>
            <p className="mt-2 text-sm text-gray-400">New gate activity will appear here.</p>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3">
          <button
            disabled={page <= 1}
            onClick={() => fetchNotifications(page - 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-bold text-gray-500">Page {page} of {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => fetchNotifications(page + 1)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
