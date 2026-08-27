import { supabase } from './supabase.js';
import { VAPID_PUBLIC_KEY } from './config.js';

let deferredInstallPrompt = null;

function addInstallStyles() {
  if (document.getElementById('shopcamzon-install-style')) return;
  const style = document.createElement('style');
  style.id = 'shopcamzon-install-style';
  style.textContent = `
    .shopcamzon-install-btn{display:none;align-items:center;gap:7px;border:0;background:#d71920;color:#fff;border-radius:9px;padding:10px 13px;font:800 11px Arial,sans-serif;cursor:pointer;box-shadow:0 8px 22px #0002;transition:.2s}
    .shopcamzon-install-btn.show{display:inline-flex}
    .shopcamzon-install-btn:hover{transform:translateY(-1px);filter:brightness(.96)}
    .shopcamzon-install-btn:active{transform:none}
    .shopcamzon-install-float{position:fixed;right:18px;bottom:18px;z-index:99990}
    @media(max-width:600px){.shopcamzon-install-float{right:14px;bottom:14px}.shopcamzon-install-btn{padding:11px 14px}}
  `;
  document.head.appendChild(style);
}

function createInstallButton() {
  if (document.getElementById('shopcamzon-install')) return document.getElementById('shopcamzon-install');
  addInstallStyles();
  const button = document.createElement('button');
  button.id = 'shopcamzon-install';
  button.className = 'shopcamzon-install-btn shopcamzon-install-float';
  button.type = 'button';
  button.innerHTML = '📲 Install Shop Camzon';
  button.title = 'Install Shop Camzon as an app';
  button.addEventListener('click', installShopCamzon);
  document.body.appendChild(button);
  return button;
}

function isStandalone() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallButton() {
  const button = createInstallButton();
  button.classList.toggle('show', !!deferredInstallPrompt && !isStandalone());
}

export function setupPWAInstall() {
  if (typeof window === 'undefined') return;
  createInstallButton();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const button = document.getElementById('shopcamzon-install');
    button?.classList.remove('show');
  });
  window.addEventListener('load', updateInstallButton, { once: true });
  setTimeout(updateInstallButton, 1200);
}

export async function installShopCamzon() {
  if (!deferredInstallPrompt) {
    if (isStandalone()) return { ok: true, reason: 'already_installed' };
    return { ok: false, reason: 'install_prompt_not_available' };
  }
  deferredInstallPrompt.prompt();
  const choice = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  updateInstallButton();
  return { ok: choice.outcome === 'accepted', reason: choice.outcome };
}

export function pwaInstallAvailable() { return !!deferredInstallPrompt && !isStandalone(); }

export async function loadNotifications({ limit = 20, userId } = {}) {
  let query = supabase.from('notifications').select('id,user_id,title,message,type,action_label,action_url,is_read,is_dismissed,created_at,image_url').eq('is_dismissed', false).order('created_at', { ascending: false }).limit(limit);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(userId) {
  let query = supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_dismissed', false).eq('is_read', false);
  if (userId) query = query.eq('user_id', userId);
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

export async function markNotificationRead(id, userId) {
  let query = supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw error;
}

export async function dismissNotification(id, userId) {
  let query = supabase.from('notifications').update({ is_dismissed: true }).eq('id', id);
  if (userId) query = query.eq('user_id', userId);
  const { error } = await query;
  if (error) throw error;
}

export async function registerNotificationServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('/sw.js', { scope: '/' }); } catch (_) { return null; }
}

function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent); }
function isStandaloneMode() { return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function base64ToUint8Array(value) { const padding = '='.repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/'); const raw = atob(base64); return Uint8Array.from([...raw].map(c => c.charCodeAt(0))); }
function detectPlatform() { if (isIOS()) return 'ios'; if (/android/i.test(navigator.userAgent)) return 'android'; if (/windows|macintosh|linux/i.test(navigator.userAgent)) return 'desktop'; return 'other'; }

export async function requestDesktopNotifications() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') {
    localStorage.setItem('shopcamzon_desktop_notifications', 'enabled');
    await registerNotificationServiceWorker();
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    localStorage.setItem('shopcamzon_desktop_notifications', 'disabled');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  localStorage.setItem('shopcamzon_desktop_notifications', permission === 'granted' ? 'enabled' : 'disabled');
  if (permission === 'granted') await registerNotificationServiceWorker();
  return permission;
}

export async function enablePushNotifications() {
  if (!window.isSecureContext) return { ok: false, reason: 'secure_context_required' };
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return { ok: false, reason: 'unsupported' };
  if (isIOS() && !isStandaloneMode()) return { ok: false, reason: 'ios_home_screen_required' };
  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY.includes('REPLACE')) return { ok: false, reason: 'vapid_key_missing' };
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') return { ok: false, reason: permission };
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToUint8Array(VAPID_PUBLIC_KEY) });
  const sessionResult = await supabase.auth.getSession();
  const user = sessionResult.data.session?.user;
  if (!user) return { ok: false, reason: 'not_authenticated' };
  const json = subscription.toJSON();
  const { error } = await supabase.from('push_subscriptions').upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth, platform: detectPlatform(), user_agent: navigator.userAgent, updated_at: new Date().toISOString() }, { onConflict: 'user_id,endpoint' });
  if (error) throw error;
  localStorage.setItem('shopcamzon_push_notifications', 'enabled');
  return { ok: true, platform: detectPlatform(), subscription };
}

export async function disablePushNotifications() {
  if (!('serviceWorker' in navigator)) return { ok: false, reason: 'unsupported' };
  const sessionResult = await supabase.auth.getSession();
  const user = sessionResult.data.session?.user;
  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    if (user) await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint);
    await subscription.unsubscribe();
  }
  localStorage.setItem('shopcamzon_push_notifications', 'disabled');
  return { ok: true };
}

export function pushNotificationsEnabled() { return localStorage.getItem('shopcamzon_push_notifications') === 'enabled'; }
export function pushSupportInfo() { return { supported: 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window, iosInstallRequired: isIOS() && !isStandaloneMode(), platform: detectPlatform() }; }
export function desktopNotificationsEnabled() { return 'Notification' in window && Notification.permission === 'granted'; }

export async function showDesktopNotification(notification) {
  if (!desktopNotificationsEnabled()) return false;
  const title = notification.title || 'Shop Camzon';
  const options = { body: notification.message || 'You have a new Shop Camzon notification.', icon: notification.image_url || '/images/shop-1.jpg', badge: '/images/shop-1.jpg', tag: `shopcamzon-${notification.id || Date.now()}`, renotify: true, data: { action_url: notification.action_url || '/notifications.html' } };
  try { const registration = await registerNotificationServiceWorker(); if (registration?.showNotification) { await registration.showNotification(title, options); return true; } } catch (_) {}
  try { const n = new Notification(title, options); n.onclick = () => { window.focus(); if (notification.action_url) window.location.href = notification.action_url; n.close(); }; return true; } catch (_) { return false; }
}

export function subscribeToNotifications(onChange, userId) {
  const channel = supabase.channel(`shop-camzon-notifications-${userId || 'all'}-${Date.now()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: userId ? `user_id=eq.${userId}` : undefined }, payload => { onChange?.(payload); if (payload.new) showDesktopNotification(payload.new); })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: userId ? `user_id=eq.${userId}` : undefined }, payload => onChange?.(payload))
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: userId ? `user_id=eq.${userId}` : undefined }, payload => onChange?.(payload))
    .subscribe();
  return channel;
}

export async function unsubscribeFromNotifications(channel) { if (channel) await supabase.removeChannel(channel); }

if (typeof window !== 'undefined') {
  registerNotificationServiceWorker();
  setupPWAInstall();
}
