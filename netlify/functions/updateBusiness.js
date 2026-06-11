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

  // Only your admin email
  if (decoded.email !== "epickering45@googlemail.com") {
    throw new Error("Unauthorized");
  }

  return decoded;
}

// ===============================
// MAIN HANDLER
// ===============================
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405 };
  }

  try {
    await verifyUser(event);

    const body = JSON.parse(event.body || "{}");
    const {
      id,
      name,
      categorySlug,
      town,
      townSlug,
      slug,
      description,
      keywords,
      email,
      phone,
      website,
      address
    } = body;

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing business id" })
      };
    }

    const ref = db.collection("businesses").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Business not found" })
      };
    }

    // Build update object
    const updateData = {
      name: name || null,
      categorySlug: categorySlug || null,
      category: categorySlug || null,
      town: town || null,
      townSlug: townSlug || null,
      slug: slug || null,
      description: description || "",
      keywords: Array.isArray(keywords) ? keywords : [],
      email: email || "",
      phone: phone || "",
      website: website || "",
      address: address || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await ref.update(updateData);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error("UPDATE BUSINESS ERROR:", err);

    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized" })
    };
  }
};
