const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  try {
    const { id } = JSON.parse(event.body || "{}");

    const doc = await db.collection("pending_submissions").doc(id).get();
    if (!doc.exists) return { statusCode: 404 };

    const data = doc.data();

    await db.collection("businesses").add({
      ...data,
      verified: false,
      ownerId: null,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection("pending_submissions").doc(id).delete();

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500 };
  }
};
