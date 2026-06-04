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
    return { statusCode: 405 };
  }

  try {
    const { businessId } = JSON.parse(event.body || "{}");

    if (!businessId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing businessId" })
      };
    }

    // Load pending changes
    const pendingRef = db.collection("pending_changes").doc(businessId);
    const pendingSnap = await pendingRef.get();

    if (!pendingSnap.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No pending changes found" })
      };
    }

    const changes = pendingSnap.data();

    // Only allow safe fields to be updated
    const allowed = {};
    const safeFields = [
      "name",
      "description",
      "phone",
      "address",
      "website",
      "hours",
      "logoUrl",
      "gallery"
    ];

    safeFields.forEach((field) => {
      if (field in changes) {
        allowed[field] = changes[field];
      }
    });

    // Update the business with approved fields
    await db.collection("businesses").doc(businessId).update(allowed);

    // Delete pending changes
    await pendingRef.delete();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error("approvePendingChanges ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
