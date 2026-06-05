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

// ===============================
// VERIFY FIREBASE TOKEN
// ===============================
async function verifyUser(event) {

  const authHeader = event.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    throw new Error("Missing token");
  }

  const token = authHeader.replace("Bearer ", "");

  const decoded = await admin.auth().verifyIdToken(token);

  // ONLY YOUR ADMIN EMAIL
  if (decoded.email !== "epickering45@googlemail.com") {
    throw new Error("Unauthorized");
  }

  return decoded;
}

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  try {

    // VERIFY USER
    await verifyUser(event);

    const { id } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing submission id" })
      };
    }

    const doc = await db
      .collection("pending_submissions")
      .doc(id)
      .get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Submission not found" })
      };
    }

    const data = doc.data();

    // MOVE TO BUSINESSES COLLECTION
    await db.collection("businesses").add({
      ...data,
      status: "approved",
      verified: false,
      ownerId: null,
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // DELETE PENDING SUBMISSION
    await db
      .collection("pending_submissions")
      .doc(id)
      .delete();

    // ============================================
    // SEND EMAIL: "Your listing is live — claim it"
    // ============================================
    // Only send approval email if NOT seeded
if (data.source !== "admin_seed") {
  await fetch(process.env.URL + "/.netlify/functions/sendListingApprovedEmail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      businessName: data.name,
      slug: data.slug,
      townSlug: data.townSlug,
      categorySlug: data.categorySlug
    })
  });
}

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {

    console.error(err);

    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }
};
