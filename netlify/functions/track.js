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
    // BASIC BOT/SPAM FILTER
    // =========================

    const ip =
      (event.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim();

    const userAgent =
      (event.headers["user-agent"] || "")
        .toLowerCase();

    // BLOCK OBVIOUS BOTS
    const botWords = [
      "bot",
      "crawl",
      "spider",
      "preview",
      "facebookexternalhit",
      "slurp",
      "curl",
      "wget",
      "python",
      "headless"
    ];

    const isBot =
      botWords.some(word =>
        userAgent.includes(word)
      );

    if(isBot){

      return {
        statusCode: 200,
        body: JSON.stringify({
          ignored: "bot"
        })
      };

    }

    // =========================
    // DUPLICATE REFRESH FILTER
    // =========================

    const recent = await db
      .collection("analytics")
      .where("ip", "==", ip)
      .where("page", "==", data.page)
      .where("event", "==", data.event)
      .limit(5)
      .get();

    let duplicate = false;

    recent.forEach(doc => {

      const d = doc.data();

      if(!d.timestamp) return;

      const diff =
        Date.now() - d.timestamp.toMillis();

      // IGNORE RELOADS WITHIN 30s
      if(diff < 30000){

        duplicate = true;

      }

    });

    if(duplicate){

      return {
        statusCode: 200,
        body: JSON.stringify({
          ignored: "duplicate"
        })
      };

    }

    // =========================
    // SAVE ANALYTICS
    // =========================

    await db.collection("analytics").add({

      ...data,

      ip: ip,

      userAgent: userAgent,

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
