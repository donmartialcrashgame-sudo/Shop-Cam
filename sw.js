const CACHE_NAME = 'shopcamzon-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/login.html',
  '/signup.html',
  '/notifications.html',
  '/manifest.webmanifest',
  '/images/shop-1.jpg',
  '/images/shop-2.jpg',
  '/images/shop-3.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: 'Shop Camzon', message: event.data?.text?.() || 'You have a new notification.' }; }
  const title = data.title || 'Shop Camzon';
  const options = {
    body: data.message || data.body || 'You have a new Shop Camzon notification.',
    icon: data.icon || data.image_url || '/images/shop-1.jpg',
    image: data.image_url || data.image || undefined,
    badge: data.badge || '/images/shop-1.jpg',
    tag: data.tag || `shopcamzon-${data.id || Date.now()}`,
    renotify: true,
    requireInteraction: Boolean(data.require_interaction),
    timestamp: Date.now(),
    vibrate: [100, 50, 100],
    data: { action_url: data.action_url || '/notifications.html', notification_id: data.id || null },
    actions: [
      { action: 'open', title: data.action_label || 'View notification' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const target = event.notification.data?.action_url || '/notifications.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const existing = list.find(client => client.url && 'focus' in client);
    if (existing) return existing.navigate(target).then(() => existing.focus());
    return clients.openWindow(target);
  }));
});

self.addEventListener('notificationclose', () => {});