import { Resend } from "resend";
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
const resend = new Resend(process.env.RESEND_API_KEY);

// --------------------------------------
// HANDLER
// --------------------------------------
export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { logId } = JSON.parse(event.body || "{}");

    if (!logId) {
      return { statusCode: 400, body: "Missing logId" };
    }

    // --------------------------------------
    // FETCH ORIGINAL LOG
    // --------------------------------------
    const logSnap = await db.collection("emailLogs").doc(logId).get();

    if (!logSnap.exists) {
      return { statusCode: 404, body: "Log not found" };
    }

    const log = logSnap.data();

    // --------------------------------------
    // REBUILD EMAIL PAYLOAD
    // --------------------------------------
    const {
      recipient,
      subject,
      listingUrl,
      businessName,
      name,
      categorySlug,
      townSlug,
      slug
    } = log;

    // Rebuild unsubscribe URL
    const unsubscribeUrl =
      `https://rctx.co.uk/unsubscribe?email=${encodeURIComponent(recipient)}`;

    // Rebuild listing URL if missing
    const finalListingUrl =
      listingUrl ||
      `https://rctx.co.uk/directory/${categorySlug}/${townSlug}/${slug}`;

    // --------------------------------------
    // LOAD TEMPLATE (same as original)
    // --------------------------------------
    const templateSnap = await db.collection("emailTemplates").doc("businessAdded").get();
    const htmlTemplate = templateSnap.exists ? templateSnap.data().html : null;

    if (!htmlTemplate) {
      return { statusCode: 500, body: "Missing email template" };
    }

    const finalHtml = htmlTemplate
      .replace(/{{name}}/g, name || "Business Owner")
      .replace(/{{businessName}}/g, businessName || "Your Business")
      .replace(/{{listingUrl}}/g, finalListingUrl)
      .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

    // --------------------------------------
    // CREATE NEW LOG ENTRY FOR RETRY
    // --------------------------------------
    const newLogRef = await db.collection("emailLogs").add({
      type: log.type || "retry",
      status: "sending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      recipient,
      subject,
      name,
      businessName,
      slug,
      townSlug,
      categorySlug,
      listingUrl: finalListingUrl,
      retryOf: logId
    });

    // --------------------------------------
    // SEND EMAIL AGAIN
    // --------------------------------------
    const resendResponse = await resend.emails.send({
      from: "RCTX Directory <support@rctx.co.uk>",
      to: recipient,
      subject,
      html: finalHtml
    });

    // --------------------------------------
    // UPDATE NEW LOG
    // --------------------------------------
    await newLogRef.update({
      status: "sent",
      resendId: resendResponse.data?.id || null,
      resendResponse,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // --------------------------------------
    // UPDATE ORIGINAL LOG
    // --------------------------------------
    await logSnap.ref.update({
      retried: true,
      retriedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Email retried",
        newLogId: newLogRef.id
      })
    };

  } catch (err) {
    console.error("RETRY ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: err.message
      })
    };
  }
      }
