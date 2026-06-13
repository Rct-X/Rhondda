const admin = require("firebase-admin");

// ======================================
// IMPORT SHARED CATEGORY ALIASES
// ======================================
const categoryAliases = require("./categoryAliases");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.RN_FIREBASE_PROJECT_ID,
      clientEmail: process.env.RN_FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.RN_FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
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
// KEYWORD BUILDER (chip‑compatible)
// ======================================
function buildKeywords({ name, category, town, description = "", extraKeywords = [] }) {

  const keywords = new Set();

  const add = (v) => {
    if (!v) return;

    v.toLowerCase()
      .split(/[\s,.-]+/)
      .forEach(word => {
        if (word.length > 1) keywords.add(word);
      });
  };

  // core fields
  add(name);
  add(category);
  add(town);
  add(description);

  // full phrases
  keywords.add(name.toLowerCase());
  keywords.add(category.toLowerCase());
  keywords.add(town.toLowerCase());
  keywords.add(`${category.toLowerCase()} ${town.toLowerCase()}`);

  // category aliases
  const normalizedCategory = category
    .toLowerCase()
    .trim()
    .replace(/s$/, "");

  const aliasKey = Object.keys(categoryAliases).find(k =>
    k.toLowerCase().replace(/s$/, "") === normalizedCategory
  );

  if (aliasKey) {
    categoryAliases[aliasKey].forEach(a => {
      keywords.add(a.toLowerCase());
    });
  }

  // NEW: keyword chips
  if (Array.isArray(extraKeywords)) {
    extraKeywords
      .map(k => k.trim().toLowerCase())
      .filter(Boolean)
      .forEach(k => keywords.add(k));
  }

  return Array.from(keywords);
}

// ======================================
// HANDLER
// ======================================
exports.handler = async (event) => {

  try {

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const data = JSON.parse(event.body || "{}");

    const {
      name,
      email,
      phone,
      town,
      category,
      website,
      address,
      description,
      wasteLicence,
      extraKeywords // now an array
    } = data;

    if (!name || !town || !category) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" })
      };
    }

    // ======================================
    // SLUGS
    // ======================================
    const slug = slugify(name);
    const townSlug = slugify(town);
    const categorySlug = slugify(category);

    // ======================================
    // KEYWORDS (shared builder)
    // ======================================
    const keywords = buildKeywords({
      name,
      category,
      town,
      description,
      extraKeywords
    });

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

      description: description || "",
      wasteLicence: wasteLicence || null,

      keywords,

      source: "admin_seed",

      // auto‑approve admin seeded listings
      status: "approved",
      verified: false,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),

      ownerId: null,

      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection("businesses").add(doc);

    // ======================================
    // EMAIL (unchanged)
    // ======================================
    if (email && data.sendEmail) {
      await fetch(
        `${process.env.URL}/.netlify/functions/sendSeededListingEmail`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {

    console.error("[ADMIN_ADD_BUSINESS]", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
