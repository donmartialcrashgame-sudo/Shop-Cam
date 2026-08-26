import { supabase } from './supabase.js';

export async function loadNotifications({ limit = 20 } = {}) {
  const { data, error } = await supabase.from('notifications').select('id,title,message,type,action_label,action_url,is_read,is_dismissed,created_at').eq('is_dismissed', false).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount() {
  const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_dismissed', false).eq('is_read', false);
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

export async function requestDesktopNotifications() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') {
    localStorage.setItem('shopcamzon_desktop_notifications', 'enabled');
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    localStorage.setItem('shopcamzon_desktop_notifications', 'disabled');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  localStorage.setItem('shopcamzon_desktop_notifications', permission === 'granted' ? 'enabled' : 'disabled');
  return permission;
}

export function desktopNotificationsEnabled() {
  return 'Notification' in window && Notification.permission === 'granted' && localStorage.getItem('shopcamzon_desktop_notifications') !== 'disabled';
}

export function showDesktopNotification(notification) {
  if (!desktopNotificationsEnabled()) return false;
  try {
    const n = new Notification(notification.title || 'Shop Camzon', {
      body: notification.message || 'You have a new Shop Camzon notification.',
      icon: 'images/shop-1.jpg',
      tag: `shopcamzon-${notification.id || Date.now()}`,
      renotify: false
    });
    n.onclick = () => {
      window.focus();
      if (notification.action_url) window.location.href = notification.action_url;
      n.close();
    };
    return true;
  } catch (_) { return false; }
}

export function subscribeToNotifications(onChange) {
  return supabase.channel(`shop-camzon-notifications-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
      onChange?.(payload);
      if (payload.new) showDesktopNotification(payload.new);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, payload => onChange?.(payload))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, payload => onChange?.(payload))
    .subscribe();
}

export async function unsubscribeFromNotifications(channel) {
  if (channel) await supabase.removeChannel(channel);
}
