import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

export async function handler(event) {
  try {
    const { name, email, message, slug } = JSON.parse(event.body);

    await admin.firestore().collection("claims").add({
      name,
      email,
      message,
      slug,
      status: "pending",
      createdAt: Date.now()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Your claim has been submitted." })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
