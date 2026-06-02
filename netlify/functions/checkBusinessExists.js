// netlify/functions/checkBusinessExists.js
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.RN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.RN_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.RN_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { slug } = JSON.parse(event.body || "{}");

    if (!slug) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing slug" })
      };
    }

    // Check approved businesses
    const q1 = await db.collection("businesses")
      .where("slug", "==", slug)
      .get();

    if (!q1.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ exists: true })
      };
    }

    // Check pending submissions
    const q2 = await db.collection("pending_submissions")
      .where("slug", "==", slug)
      .get();

    if (!q2.empty) {
      return {
        statusCode: 200,
        body: JSON.stringify({ exists: true })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ exists: false })
    };

  } catch (err) {
    console.error("checkBusinessExists error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
