// netlify/functions/placesProxy.js
const fetch = require("node-fetch");
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

exports.handler = async (event, context) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const params = event.queryStringParameters || {};
    const query = params.query;

    if (!query) {
      return { statusCode: 400, body: "Missing query" };
    }

    const apiKey = process.env.GOOGLE_PLACES_API;
    if (!apiKey) {
      return { statusCode: 500, body: "Missing API key" };
    }

    // --- call Google Places ---
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query
    )}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    // --- log usage ---
    await logUsage();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data }),
    };
  } catch (err) {
    console.error("placesProxy error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};

async function logUsage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // "2026-06-10"

  const ref = db.collection("system").doc("placesUsage");
  await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : {};

    const todayCount = (existing.daily && existing.daily[today]) || 0;
    const total = existing.total || 0;

    const daily = existing.daily || {};
    daily[today] = todayCount + 1;

    tx.set(
      ref,
      {
        total: total + 1,
        daily,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
