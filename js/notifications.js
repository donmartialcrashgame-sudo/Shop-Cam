import { supabase } from './supabase.js';

export async function loadNotifications({ limit = 20 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,title,message,type,action_label,action_url,is_read,is_dismissed,created_at')
    .eq('is_dismissed', false)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_dismissed', false)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function dismissNotification(id) {
  const { error } = await supabase.from('notifications').update({ is_dismissed: true }).eq('id', id);
  if (error) throw error;
}

export function subscribeToNotifications(onChange) {
  return supabase
    .channel('shop-camzon-notifications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, onChange)
    .subscribe();
}

export async function unsubscribeFromNotifications(channel) {
  if (channel) await supabase.removeChannel(channel);
}
