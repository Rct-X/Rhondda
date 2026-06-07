const admin = require("firebase-admin");

// =========================
// INITIALISE FIREBASE
// =========================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: process.env.RN_FIREBASE_PROJECT_ID,
      client_email: process.env.RN_FIREBASE_CLIENT_EMAIL,
      private_key: process.env.RN_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

// =========================
// CORS HEADERS (REQUIRED)
// =========================
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// =========================
// NETLIFY FUNCTION
// =========================
exports.handler = async (event) => {

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK"
    };
  }

  // ONLY ALLOW POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");

    // =========================
    // BASIC BOT/SPAM FILTER
    // =========================
    const ip = (event.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const userAgent = (event.headers["user-agent"] || "").toLowerCase();

    const botWords = [
      "bot", "crawl", "spider", "preview",
      "facebookexternalhit", "slurp", "curl",
      "wget", "python", "headless"
    ];

    const isBot = botWords.some(word => userAgent.includes(word));

    if (isBot) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ignored: "bot" })
      };
    }

    // =========================
    // DUPLICATE REFRESH FILTER
    // =========================
    const recent = await db
      .collection("analytics")
      .where("ip", "==", ip)
      .where("businessId", "==", data.businessId || null)
      .where("event", "==", data.event)
      .limit(5)
      .get();

    let duplicate = false;

    recent.forEach(doc => {
      const d = doc.data();
      if (!d.timestamp) return;

      const diff = Date.now() - d.timestamp.toMillis();
      if (diff < 30000) duplicate = true;
    });

    if (duplicate) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ignored: "duplicate" })
      };
    }

    // =========================
    // SAVE ANALYTICS
    // =========================
    await db.collection("analytics").add({
      ...data,
      ip,
      userAgent,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
