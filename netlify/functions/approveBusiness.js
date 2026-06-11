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
    await verifyUser(event);

    const {
      id,
      categorySlug,
      townSlug,
      businessSlug,
      keywords
    } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing submission id" })
      };
    }

    const doc = await db.collection("pending_submissions").doc(id).get();

    if (!doc.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Submission not found" })
      };
    }

    const data = doc.data();

    // Build final business object
    const finalBusiness = {
      ...data,
      status: "approved",
      verified: false,
      ownerId: null,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),

      // NEW FIELDS FROM ADMIN PANEL
      categorySlug: categorySlug || data.categorySlug || null,
      townSlug: townSlug || data.townSlug || null,
      slug: businessSlug || data.slug || null,
      keywords: keywords || data.keywords || []
    };

    // Also store category for convenience
    finalBusiness.category = finalBusiness.categorySlug;

    // Save to businesses
    await db.collection("businesses").add(finalBusiness);

    // Delete pending submission
    await db.collection("pending_submissions").doc(id).delete();

    // Send email (only if not admin seeded)
    if (data.source !== "admin_seed") {
      await fetch(process.env.URL + "/.netlify/functions/sendListingApprovedEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          businessName: data.name,
          slug: finalBusiness.slug,
          townSlug: finalBusiness.townSlug,
          categorySlug: finalBusiness.categorySlug
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
