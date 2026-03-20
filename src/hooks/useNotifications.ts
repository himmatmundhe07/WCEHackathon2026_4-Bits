import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Use `any` cast because the Supabase generated types don't include the
// notifications table yet — run `supabase gen types` after creating the table.
const db = supabase as any;

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'appointment' | 'approval' | 'alert';
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await db
      .from('notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    const list = (data || []) as AppNotification[];
    setNotifications(list);
    setUnreadCount(list.filter((n: AppNotification) => !n.is_read).length);
  }, [userId]);

  useEffect(() => {
    fetch();
    if (!userId) return;
    const channel = supabase.channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_user_id=eq.${userId}`,
      }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetch]);

  const markRead = async (id: string) => {
    await db.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await db.from('notifications').update({ is_read: true })
      .eq('recipient_user_id', userId).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await db.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, unreadCount, markRead, markAllRead, deleteNotification, refetch: fetch };
}

/** Helper to send a notification from the client side */
export async function sendNotification({
  recipientUserId, recipientType, title, body, type = 'info', relatedId,
}: {
  recipientUserId: string;
  recipientType: 'patient' | 'hospital' | 'admin';
  title: string;
  body: string;
  type?: 'info' | 'appointment' | 'approval' | 'alert';
  relatedId?: string;
}) {
  await db.from('notifications').insert({
    recipient_user_id: recipientUserId,
    recipient_type: recipientType,
    title,
    body,
    type,
    related_id: relatedId || null,
  });
}
