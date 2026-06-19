// ============================================================
// BRIM BURGERS — "ORDER READY" PUSH TRIGGER
// ============================================================
// This runs on Google's servers, not in the browser. It watches the
// Realtime Database, and the moment any order's status flips to "ready"
// (i.e. staff taps "Ready" on the dashboard), it sends a real push
// notification straight to that customer's phone — works even if their
// browser is closed or the phone is locked, because push delivery is
// handled by the OS, not by any webpage staying open.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyOrderReady = functions.database
  .ref('/orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val() || {};
    const after = change.after.val() || {};

    // Only act on the exact moment status becomes "ready" (ignore every
    // other field update, and ignore it if it was already ready before).
    if (after.status !== 'ready' || before.status === 'ready') {
      return null;
    }

    const token = after.fcmToken;
    if (!token) {
      console.log(
        `Order ${context.params.orderId}: no fcmToken stored — customer ` +
        `likely declined the notification prompt. In-page buzz is the ` +
        `only channel for this one.`
      );
      return null;
    }

    const message = {
      token: token,
      notification: {
        title: 'Brim Burgers 🍔',
        body: `Your order for Table ${after.table || ''} is ready! Come grab it.`
      },
      webpush: {
        fcmOptions: { link: '/' },
        notification: {
          vibrate: [400, 150, 400, 150, 400],
          requireInteraction: true,
          icon: '/icon-192.png'
        }
      }
    };

    try {
      await admin.messaging().send(message);
      console.log(`Push sent for order ${context.params.orderId}`);
    } catch (err) {
      // Common cause: token expired/unsubscribed (e.g. customer cleared
      // browser data). Not fatal — just means this one customer falls
      // back to in-page buzz / staff bringing the order out manually.
      console.error(`Push failed for order ${context.params.orderId}:`, err.message);
    }

    return null;
  });
