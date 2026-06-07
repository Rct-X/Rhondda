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

// ======================================
// SLUGIFY
// ======================================
function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================================
// CATEGORY SEARCH ALIASES
// ======================================
const categoryAliases = {
  "Electricians": [
    "electrician",
    "sparky",
    "rewire",
    "electrical",
    "fuse board"
  ],
  "Plumbers": [
    "plumber",
    "boiler repair",
    "leak",
    "blocked sink"
  ],
  "Driving Schools": [
    "driving lessons",
    "driving instructor",
    "learn to drive",
    "driving school"
  ],
  "Handyman Services": [
    "handyman",
    "odd jobs",
    "home repairs",
    "maintenance"
  ]
};

// ======================================
// KEYWORD BUILDER
// ======================================
function buildKeywords({ name, category, town, description = "", extraKeywords = "" }) {

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
  const aliasKey = Object.keys(categoryAliases).find(
    k => k.toLowerCase() === category.toLowerCase()
  );

  if (aliasKey) {
    categoryAliases[aliasKey].forEach(a => {
      keywords.add(a.toLowerCase());
    });
  }

  // extra keywords
  if (extraKeywords) {
    extraKeywords
      .split(",")
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

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const {
      name,
      email,
      category,
      town,
      phone,
      website,
      address,
      description,
      extraKeywords,
      wasteLicence
    } = body;

    if (!name || !category || !town || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields." })
      };
    }

    // ===============================
    // WASTE LICENCE VALIDATION
    // ===============================
    const wasteCategories = [
      "Waste Collection",
      "Removals",
      "House Clearances"
    ];

    const requiresWasteLicence = wasteCategories.includes(category);

    if (requiresWasteLicence && !wasteLicence) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Waste carrier licence number is required for this category."
        })
      };
    }

    const categorySlug = slugify(category);
    const townSlug = slugify(town);
    const slug = slugify(name);

    // ===============================
    // BUILD KEYWORDS (NEW FUNCTION)
    // ===============================
    const keywords = buildKeywords({
      name,
      category,
      town,
      description,
      extraKeywords
    });

    // ===============================
    // DOCUMENT
    // ===============================
    const doc = {
      name,
      slug,
      category,
      categorySlug,
      town,
      townSlug,

      email: email || null,
      phone: phone || null,
      website: website || null,
      address: address || null,

      description,
      wasteLicence: wasteLicence || null,

      keywords,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "pending"
    };

    await db.collection("pending_submissions").add(doc);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (err) {
    console.error("submitBusiness error", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
