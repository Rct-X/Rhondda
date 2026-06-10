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

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const query = event.queryStringParameters.query;
    if (!query) {
      return { statusCode: 400, body: "Missing query" };
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: "Missing API key" };
    }

    // 1️⃣ TEXT SEARCH
    const searchUrl =
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, data: [] })
      };
    }

    // 2️⃣ FETCH PHONE NUMBERS FOR EACH RESULT
    const enrichedResults = [];

    for (const biz of searchData.results) {
      let phone = "";
      let website = biz.website || "";

      try {
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${biz.place_id}&fields=formatted_phone_number,international_phone_number,website&key=${apiKey}`;

        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        phone =
          detailsData.result?.formatted_phone_number ||
          detailsData.result?.international_phone_number ||
          "";

        website = detailsData.result?.website || website;
      } catch (err) {
        console.error("Details lookup failed", err);
      }

      enrichedResults.push({
        ...biz,
        phone,
        website
      });
    }

    // 3️⃣ LOG USAGE
    await logUsage();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        data: { results: enrichedResults }
      })
    };

  } catch (err) {
    console.error("placesProxy error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};

async function logUsage() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const ref = db.collection("system").doc("placesUsage");

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existing = snap.exists ? snap.data() : {};

    const daily = existing.daily || {};
    daily[today] = (daily[today] || 0) + 1;

    tx.set(
      ref,
      {
        total: (existing.total || 0) + 1,
        daily,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}
