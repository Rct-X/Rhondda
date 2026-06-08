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

exports.handler = async () => {

  try {

    const [
      businessesSnap,
      pendingSnap,
      claimsSnap
    ] = await Promise.all([

      db.collection("businesses").count().get(),

      db.collection("pending_submissions")
        .count()
        .get(),

      db.collection("claims")
        .where("status", "==", "pending")
        .count()
        .get()

    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalBusinesses:
          businessesSnap.data().count,

        pendingSubmissions:
          pendingSnap.data().count,

        pendingClaims:
          claimsSnap.data().count
      })
    };

  } catch(err){

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };

  }
};
