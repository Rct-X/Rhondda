const admin = require("firebase-admin");
const fetch = require("node-fetch");

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
    const { claimId } = JSON.parse(event.body || "{}");

    const claimRef = db.collection("claims").doc(claimId);
    const claimSnap = await claimRef.get();

    if (!claimSnap.exists) {
      return { statusCode: 404, body: JSON.stringify({ error: "Claim not found" }) };
    }

    const claim = claimSnap.data();

    // Find the business by slug
    const bizSnap = await db
      .collection("businesses")
      .where("slug", "==", claim.slug)
      .limit(1)
      .get();

    if (bizSnap.empty) {
      return { statusCode: 404, body: JSON.stringify({ error: "Business not found" }) };
    }

    const bizRef = bizSnap.docs[0].ref;
    const biz = bizSnap.docs[0].data();

    // Mark business as having a pending owner
    await bizRef.update({
      ownerStatus: "pending-setup" // or ownerId: "pending"
    });

    // Send the approval email
    await fetch(process.env.URL + "/.netlify/functions/sendClaimApproval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: claim.name,
        email: claim.email,
        businessName: biz.name,
        slug: biz.slug
      })
    });

    // Mark claim as approved
    await claimRef.update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
