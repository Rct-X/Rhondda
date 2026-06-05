const admin = require("firebase-admin");

if (!admin.apps.length) {

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:
        process.env.RN_FIREBASE_PROJECT_ID,

      clientEmail:
        process.env.RN_FIREBASE_CLIENT_EMAIL,

      privateKey:
        process.env
          .RN_FIREBASE_PRIVATE_KEY
          ?.replace(/\\n/g, "\n")
    })
  });
}

const db = admin.firestore();

exports.handler = async (event) => {

  try {

    if(event.httpMethod !== "POST"){

      return {
        statusCode:405,
        body:JSON.stringify({
          error:"Method not allowed"
        })
      };
    }

    const data =
      JSON.parse(event.body || "{}");

    if(
      !data.name ||
      !data.town ||
      !data.category
    ){

      return {
        statusCode:400,
        body:JSON.stringify({
          error:"Missing required fields"
        })
      };
    }

    await db
      .collection("pending_submissions")
      .add({

        ...data,

        status:"pending",

        source:"admin_seed",

        createdAt:
          admin.firestore.FieldValue
            .serverTimestamp()
      });

    return {
      statusCode:200,
      body:JSON.stringify({
        ok:true
      })
    };

  } catch(err){

    console.error(
      "[ADMIN_ADD_BUSINESS]",
      err
    );

    return {
      statusCode:500,
      body:JSON.stringify({
        error:err.message
      })
    };
  }
};
