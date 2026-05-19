const admin = require("firebase-admin");

// =========================
// INITIALISE FIREBASE
// =========================
if (!admin.apps.length) {

  admin.initializeApp({

    credential: admin.credential.cert({

      project_id:
        process.env.RN_FIREBASE_PROJECT_ID,

      client_email:
        process.env.RN_FIREBASE_CLIENT_EMAIL,

      private_key:
        process.env.RN_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")

    })

  });

}

const db = admin.firestore();

// =========================
// NETLIFY FUNCTION
// =========================
exports.handler = async (event) => {

  // ONLY ALLOW POST
  if (event.httpMethod !== "POST") {

    return {
      statusCode: 405,
      body: JSON.stringify({
        error: "Method Not Allowed"
      })
    };

  }

  try {

    const data =
      JSON.parse(event.body || "{}");

    // =========================
    // SAVE ANALYTICS
    // =========================
    await db.collection("analytics").add({

      ...data,

      timestamp:
        admin.firestore.FieldValue.serverTimestamp()

    });

    return {

      statusCode: 200,

      body: JSON.stringify({
        success: true
      })

    };

  } catch (err) {

    console.error(err);

    return {

      statusCode: 500,

      body: JSON.stringify({
        error: err.message
      })

    };

  }

};
