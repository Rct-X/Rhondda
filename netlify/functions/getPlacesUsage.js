// netlify/functions/getPlacesUsage.js
const admin = require("firebase-admin");

let app;
if (!admin.apps.length) {
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.RN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.RN_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.RN_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
} else {
  app = admin.app();
}

const db = admin.firestore();

exports.handler = async () => {
  try {
    const ref = db.collection("system").doc("placesUsage");
    const snap = await ref.get();

    if (!snap.exists) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          total: 0,
          today: 0,
          daily: {},
          resetTime: "08:00 UK (midnight Pacific)",
        }),
      };
    }

    const data = snap.data();
    const daily = data.daily || {};
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = daily[today] || 0;

    // simple 7‑day average
    const days = Object.keys(daily).sort().slice(-7);
    const sum = days.reduce((acc, d) => acc + (daily[d] || 0), 0);
    const avg7 = days.length ? sum / days.length : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        total: data.total || 0,
        today: todayCount,
        daily,
        avg7,
        resetTime: "08:00 UK (midnight Pacific)",
      }),
    };
  } catch (err) {
    console.error("getPlacesUsage error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
