const admin = require("firebase-admin");

// -----------------------------
// INIT SAFELY (IMPORTANT FIX)
// -----------------------------
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

    const {
      propertyId,
      name,
      email,
      password
    } = JSON.parse(event.body || "{}");

    if (!propertyId || !email || !password) {
      return res(400, { error: "Missing fields" });
    }

    // -----------------------------
    // 1. CREATE AUTH USER
    // -----------------------------
    const user = await auth.createUser({
      email,
      password,
      displayName: name || email
    });

    const uid = user.uid;

    // -----------------------------
    // 2. GET PROPERTY (IMPORTANT FOR DOMAIN)
    // -----------------------------
    const propertyRef = db.collection("properties").doc(propertyId);
    const propertySnap = await propertyRef.get();

    const property = propertySnap.exists ? propertySnap.data() : {};
    const siteDomain = property.siteDomain || "https://rctx.co.uk";

    // -----------------------------
    // 3. USER PROFILE
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
    // 4. LINK PROPERTY
    // -----------------------------
    await propertyRef.update({
      ownerId: uid,
      ownerEmail: email,
      ownerName: name || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // -----------------------------
    // 5. EMAIL (RESEND)
    // -----------------------------
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
              <a href="${siteDomain}/owner">
                ${siteDomain}/owner
              </a>
            </p>

            <p style="color:#777;font-size:12px">
              Please change your password after login.
            </p>

          </div>
        `
      })
    });

    return res(200, {
      ok: true,
      uid,
      siteDomain,
      mustChangePassword: true
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
