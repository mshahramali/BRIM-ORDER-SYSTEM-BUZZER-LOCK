// ============================================================
// BRIM BURGERS — "ORDER READY" PUSH TRIGGER
// ============================================================
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyOrderReady = functions.database
  .ref('/orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val() || {};
    const after = change.after.val() || {};

    if (after.status !== 'ready' || before.status === 'ready') {
      return null;
    }

    const token = after.fcmToken;
    if (!token) {
      console.log(`Order ${context.params.orderId}: no fcmToken stored.`);
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
      console.error(`Push failed for order ${context.params.orderId}:`, err.message);
    }

    return null;
  });
