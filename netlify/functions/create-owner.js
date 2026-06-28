const admin = require("firebase-admin");

// Init
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

    const { propertyId, name, email, password } =
      JSON.parse(event.body || "{}");

    if (!propertyId || !email || !password) {
      return res(400, { error: "Missing fields" });
    }

    // -----------------------------
    // 1. Create Auth user
    // -----------------------------
    const user = await auth.createUser({
      email,
      password,
      displayName: name || email
    });

    const uid = user.uid;

    // -----------------------------
    // 2. Create USER PROFILE (IMPORTANT)
    // -----------------------------
    await db.collection("users").doc(uid).set({
      uid,
      email,
      name: name || "",
      role: "owner",
      propertyId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // -----------------------------
    // 3. Update property link
    // -----------------------------
    await db.collection("properties").doc(propertyId).update({
      ownerId: uid,
      ownerEmail: email,
      ownerName: name || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // -----------------------------
    // 4. OPTIONAL EMAIL (placeholder)
    // -----------------------------
    console.log("Send email to:", email);
    console.log("Temp password:", password);

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
