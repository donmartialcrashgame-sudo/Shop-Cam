self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.action_url || '/notifications.html';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const existing = list.find(client => 'focus' in client);
    if (existing) return existing.navigate(target).then(() => existing.focus());
    return clients.openWindow(target);
  }));
});
