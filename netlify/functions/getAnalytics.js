const admin = require("firebase-admin");

// =========================
// FIREBASE INIT
// =========================
if (!admin.apps.length) {

  admin.initializeApp({

    credential: admin.credential.cert({

      projectId:
        process.env.RN_FIREBASE_PROJECT_ID,

      clientEmail:
        process.env.RN_FIREBASE_CLIENT_EMAIL,

      privateKey:
        process.env.RN_FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")

    })

  });

}

const db = admin.firestore();

// =========================
// GET ANALYTICS
// =========================
exports.handler = async () => {

  try {

    const snapshot =
      await db
      .collection("analytics")
      .orderBy("timestamp", "desc")
      .limit(5000)
      .get();

    const analytics =
      snapshot.docs.map(doc => ({

        id: doc.id,

        ...doc.data(),

        timestamp:
          doc.data().timestamp?.toMillis?.() || 0

      }));

    return {

      statusCode: 200,

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify(analytics)

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
