const admin = require("firebase-admin");

if (!admin.apps.length) {

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {

  try {

    // ===============================
    // AUTH
    // ===============================

    const authHeader =
      event.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {

      return {
        statusCode: 401,
        body: JSON.stringify({
          error: "Unauthorized"
        })
      };
    }

    const token =
      authHeader.replace("Bearer ", "");

    await admin.auth().verifyIdToken(token);

    // ===============================
    // BODY
    // ===============================

    const body =
      JSON.parse(event.body || "{}");

    const { start, end, all } = body;

    let query =
      db.collection("analytics");

    // ===============================
    // DELETE ALL
    // ===============================

    if (!all) {

      if (!start || !end) {

        return {
          statusCode: 400,
          body: JSON.stringify({
            error: "Missing dates"
          })
        };
      }

      const startTime =
        new Date(start).getTime();

      const endTime =
        new Date(end).getTime() + 86400000;

      query = query
        .where("timestamp", ">=", startTime)
        .where("timestamp", "<=", endTime);
    }

    const snap = await query.get();

    if (snap.empty) {

      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "No analytics found"
        })
      };
    }

    // ===============================
    // DELETE
    // ===============================

    let deleted = 0;

    let batch = db.batch();

    for (let i = 0; i < snap.docs.length; i++) {

      batch.delete(snap.docs[i].ref);

      deleted++;

      if ((i + 1) % 450 === 0) {

        await batch.commit();

        batch = db.batch();
      }
    }

    await batch.commit();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        deleted,
        message:
          `Deleted ${deleted} analytics records`
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
