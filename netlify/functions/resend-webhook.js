import admin from "firebase-admin";

// --------------------------------------
// FIREBASE ADMIN INIT
// --------------------------------------
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

// --------------------------------------
// HANDLER
// --------------------------------------
export async function handler(event) {
  try {
    // Resend sends POST only
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body);

    const { type, data } = body;
    const resendId = data?.id;

    if (!resendId) {
      return { statusCode: 400, body: "Missing resendId" };
    }

    // --------------------------------------
    // FIND LOG ENTRY
    // --------------------------------------
    const snap = await db
      .collection("emailLogs")
      .where("resendId", "==", resendId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.warn("No matching email log for resendId:", resendId);
      return { statusCode: 200, body: "No matching log" };
    }

    const ref = snap.docs[0].ref;

    // --------------------------------------
    // EVENT HANDLING
    // --------------------------------------
    const update = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    switch (type) {
      case "email.delivered":
        update.status = "delivered";
        update.deliveredAt = Date.now();
        break;

      case "email.bounced":
        update.status = "bounced";
        update.error = data?.error || "Bounce";
        break;

      case "email.opened":
        update.openedAt = Date.now();
        break;

      case "email.clicked":
        update.clickedAt = Date.now();
        break;

      case "email.complained":
        update.status = "complained";
        break;

      default:
        console.log("Unhandled Resend event:", type);
        break;
    }

    await ref.update(update);

    return {
      statusCode: 200,
      body: "Webhook processed"
    };

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return {
      statusCode: 500,
      body: "Webhook error"
    };
  }
}
