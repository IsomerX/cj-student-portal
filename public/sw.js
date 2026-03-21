// Service Worker for PWA Push Notifications
// SchoolDost Student Portal

console.log('🔧 Service worker loaded');

// Handle push notification received
self.addEventListener('push', function (event) {
  console.log('📬 Push notification received:', event);

  if (!event.data) {
    console.warn('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📦 Push data:', data);

    const title = data.title || 'SchoolDost';
    const options = {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/icon-96x96.png',
      data: data.data || {},
      timestamp: data.timestamp || Date.now(),
      requireInteraction: false,
      vibrate: [200, 100, 200],
      tag: data.data?.classId || data.data?.batchId || 'notification',
      actions: [],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  console.log('🖱️ Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data;
  let url = '/';

  // Deep linking based on notification type
  if (data.action === 'join_class' && data.classId) {
    url = `/live-classes/${data.classId}`;
  } else if (data.action === 'view_recording' && data.classId) {
    url = `/live-classes/${data.classId}`;
  } else if (data.action === 'view_batch' && data.batchId) {
    url = `/batches/${data.batchId}`;
  } else if (data.classId) {
    url = `/live-classes/${data.classId}`;
  } else if (data.batchId) {
    url = `/batches/${data.batchId}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', function (event) {
  console.log('🔄 Push subscription changed');

  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(self.VAPID_PUBLIC_KEY),
    }).then(function (newSubscription) {
      // Send new subscription to server
      return fetch('/api/web-push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: newSubscription }),
      });
    })
  );
});

// Utility function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

console.log('✅ Service worker installed');
