self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: 'Shop Camzon', message: event.data?.text?.() || 'You have a new notification.' }; }
  const title = data.title || 'Shop Camzon';
  const options = {
    body: data.message || data.body || 'You have a new Shop Camzon notification.',
    icon: data.image_url || data.icon || '/images/shop-1.jpg',
    image: data.image_url || data.image || undefined,
    badge: '/images/shop-1.jpg',
    tag: data.tag || `shopcamzon-${data.id || Date.now()}`,
    renotify: true,
    data: { action_url: data.action_url || '/notifications.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.action_url || '/notifications.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const existing = list.find(client => 'focus' in client);
    if (existing) return existing.navigate(target).then(() => existing.focus());
    return clients.openWindow(target);
  }));
});
