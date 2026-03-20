import { useState, useRef, useEffect } from 'react';
import { Bell, X, CheckCheck, Calendar, ShieldCheck, Info, AlertTriangle } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const typeIcons: Record<string, { icon: any; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: '#0891B2', bg: '#EBF7FA' },
  approval:    { icon: ShieldCheck, color: '#10B981', bg: '#F0FDF4' },
  alert:       { icon: AlertTriangle, color: '#F59E0B', bg: '#FFFBEB' },
  info:        { icon: Info, color: '#64748B', bg: '#F1F5F9' },
};

interface NotificationBellProps {
  userId: string | null;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications(userId);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) markRead(n.id);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} style={{ color: '#64748B' }} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ background: '#EF4444', minWidth: '16px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-[200] w-[360px] bg-white rounded-xl shadow-xl overflow-hidden"
          style={{ border: '1px solid #E2EEF1', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #E2EEF1' }}>
            <span className="text-[14px] font-bold" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif', color: '#1E293B' }}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] text-white" style={{ background: '#EF4444' }}>{unreadCount}</span>
              )}
            </span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: '#0891B2' }}>
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={28} className="mx-auto mb-2" style={{ color: '#D1EBF1' }} />
                <p className="text-[13px]" style={{ color: '#94A3B8' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const { icon: Icon, color, bg } = typeIcons[n.type] || typeIcons.info;
                return (
                  <div key={n.id}
                    onClick={() => handleClick(n)}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      background: n.is_read ? 'white' : '#F7FBFC',
                    }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: bg }}>
                      <Icon size={15} style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: '#1E293B' }}>{n.title}</p>
                      <p className="text-[12px] mt-0.5" style={{ color: '#64748B' }}>{n.body}</p>
                      <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.is_read && <span className="w-2 h-2 rounded-full" style={{ background: '#0891B2' }} />}
                      <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                        className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} style={{ color: '#94A3B8' }} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
