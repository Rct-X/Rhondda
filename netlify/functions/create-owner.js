const admin = require("firebase-admin");

// Prevent re-init in Netlify
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();
const auth = admin.auth();

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return res(405, { error: "POST only" });
  }

  try {

    const body = JSON.parse(event.body || "{}");

    const {
      propertyId,
      name,
      email,
      password
    } = body;

    if (!propertyId || !email || !password) {
      return res(400, { error: "Missing fields" });
    }

    // -----------------------------
    // 1. Create Firebase Auth user
    // -----------------------------
    const user = await auth.createUser({
      email,
      password,
      displayName: name || email
    });

    const uid = user.uid;

    // -----------------------------
    // 2. Update property
    // -----------------------------
    await db.collection("properties")
      .doc(propertyId)
      .update({
        ownerId: uid,
        ownerEmail: email,
        ownerName: name || "",
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    // -----------------------------
    // 3. Optional: create owner profile doc
    // -----------------------------
    await db.collection("owners").doc(uid).set({
      uid,
      email,
      name: name || "",
      propertyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res(200, {
      ok: true,
      uid,
      message: "Owner created successfully"
    });

  } catch (err) {
    console.error(err);
    return res(500, { error: err.message });
  }
};

// -----------------------------
// helper
// -----------------------------
function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(body)
  };
}
