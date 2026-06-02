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
  if (decoded.email !== "eddyjohnpickering@gmail.com") {
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
        body: JSON.stringify({
          error: "Missing submission id"
        })
      };
    }

    await db
      .collection("pending_submissions")
      .doc(id)
      .delete();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true
      })
    };

  } catch (err) {

    console.error(err);

    return {
      statusCode: 401,
      body: JSON.stringify({
        error: "Unauthorized"
      })
    };
  }
};
