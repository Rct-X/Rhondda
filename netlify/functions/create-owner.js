const admin = require("firebase-admin");

// Init
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
await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    from: "RCTX <no-reply@rctx.co.uk>",
    to: email,
    subject: "Your Holiday Let Owner Login",
    html: `
      <div style="font-family:Arial;padding:20px">
        <h2>Your Owner Account is Ready</h2>

        <p>Hi ${name || "there"},</p>

        <p>Your owner dashboard has been created.</p>

        <hr>

        <p><strong>Login details:</strong></p>
        <p>Email: ${email}</p>
        <p>Password: ${password}</p>

        <hr>

        <p>
          Login here:
          <a href="https://rctx.co.uk/owner">
            https://rctx.co.uk/owner
          </a>
        </p>

        <p style="color:#777;font-size:12px">
          Please change your password after login.
        </p>
      </div>
    `
  })
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
