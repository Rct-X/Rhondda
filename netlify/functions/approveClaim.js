import admin from "firebase-admin";
import fetch from "node-fetch";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

export async function handler(event) {
  try {
    const { claimId } = JSON.parse(event.body);

    const claimRef = admin.firestore().collection("claims").doc(claimId);
    const claimSnap = await claimRef.get();
    const claim = claimSnap.data();

    // Find business by slug
    const businessSnap = await admin.firestore()
      .collection("businesses")
      .where("slug", "==", claim.slug)
      .get();

    const businessRef = businessSnap.docs[0].ref;
    const business = businessSnap.docs[0].data();

    // Mark business as claimed (owner will create account next)
    await businessRef.update({
      ownerId: "pending"
    });

    // Send the approval email
    await fetch(process.env.URL + "/.netlify/functions/sendClaimApproval", {
      method: "POST",
      body: JSON.stringify({
        name: claim.name,
        email: claim.email,
        businessName: business.name,
        slug: business.slug
      })
    });

    // Mark claim as approved
    await claimRef.update({
      status: "approved",
      emailSent: true,
      approvedAt: Date.now()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Claim approved + email sent" })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
