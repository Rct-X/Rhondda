const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    const { name, email, message, slug } = JSON.parse(event.body);

    await db.collection("business_claim_requests").add({
      name,
      email,
      message,
      slug,
      createdAt: new Date()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Your claim has been submitted. We will contact you soon." })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error submitting claim." })
    };
  }
};
