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

// ======================================
// SLUGIFY
// ======================================

function slugify(str = "") {

  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================================
// HANDLER
// ======================================

exports.handler = async (event) => {

  try {

    if (event.httpMethod !== "POST") {

      return {
        statusCode: 405,
        body: JSON.stringify({
          error: "Method not allowed"
        })
      };
    }

    const data =
      JSON.parse(event.body || "{}");

    const {
      name,
      email,
      phone,
      town,
      category,
      website,
      address,
      description,
      wasteLicence
    } = data;

    if (
      !name ||
      !town ||
      !category
    ) {

      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields"
        })
      };
    }

    // ======================================
    // SLUGS
    // ======================================

    const slug =
      slugify(name);

    const townSlug =
      slugify(town);

    const categorySlug =
      slugify(category);

    // ======================================
    // KEYWORDS
    // ======================================

    const keywords = [

      name.toLowerCase(),

      category.toLowerCase(),

      town.toLowerCase(),

      `${category.toLowerCase()} ${town.toLowerCase()}`
    ];

    // ======================================
    // DOCUMENT
    // ======================================

    const doc = {

      name,

      slug,

      town,
      townSlug,

      category,
      categorySlug,

      email: email || null,

      phone: phone || null,

      website: website || null,

      address: address || town,

      description:
        description || "",

      wasteLicence:
        wasteLicence || null,

      keywords,

      source: "admin_seed",

      status: "pending",

      verified: false,

      ownerId: null,

      createdAt:
        admin.firestore.FieldValue
          .serverTimestamp()
    };

    // ======================================
    // SAVE
    // ======================================

    await db.collection("businesses").add({
  ...doc,
  status: "approved",
  verified: true,
  approvedAt: admin.firestore.FieldValue.serverTimestamp()
});

    // ======================================
    // SEND EMAIL
    // ======================================

    if (email) {

      await fetch(
        `${process.env.URL}/.netlify/functions/sendSeededListingEmail`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            name,

            email,

            businessName: name,

            slug,
            townSlug,
            categorySlug
          })
        }
      );
    }

    return {

      statusCode: 200,

      body: JSON.stringify({
        ok: true
      })
    };

  } catch (err) {

    console.error(
      "[ADMIN_ADD_BUSINESS]",
      err
    );

    return {

      statusCode: 500,

      body: JSON.stringify({
        error: err.message
      })
    };
  }
};
