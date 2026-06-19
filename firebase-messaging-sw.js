// ============================================================
// BRIM BURGERS — BACKGROUND PUSH SERVICE WORKER
// ============================================================
// This file runs separately from the page, managed by the browser/OS.
// It's what lets the "your order is ready" buzz fire even when the
// customer's phone is locked or the tab/browser is closed.
//
// IMPORTANT: the firebaseConfig below must match firebase-config.js
// exactly. Service workers can't share variables with the page, so the
// config is duplicated here on purpose. If you ever change project
// credentials, update both files.

importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBpI_nGmuLUCmR1AV6jN3vxJadC2TQVDj4",
  authDomain: "brim-order-system-locked-on.firebaseapp.com",
  databaseURL: "https://brim-order-system-locked-on-default-rtdb.firebaseio.com",
  projectId: "brim-order-system-locked-on",
  storageBucket: "brim-order-system-locked-on.firebasestorage.app",
  messagingSenderId: "780330416946",
  appId: "1:780330416946:web:73510d94f62e431dca352b"
});

const messaging = firebase.messaging();

// Fires when a push arrives and the page/tab is NOT in the foreground
// (locked screen, different app, or browser fully closed on Android).
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Brim Burgers';
  const body = (payload.notification && payload.notification.body) || 'Your order is ready!';

  self.registration.showNotification(title, {
    body: body,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [400, 150, 400, 150, 400],
    tag: 'brim-order-ready',
    requireInteraction: true,
    data: payload.data || {}
  });
});

// Bring the menu/status page to the front if the customer taps the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
