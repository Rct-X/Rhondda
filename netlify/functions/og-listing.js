const fetch = require("node-fetch");

// =======================
// HTML ESCAPE
// =======================
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =======================
// HANDLER
// =======================
exports.handler = async (event) => {
  try {
    const base = "https://rctx.co.uk";
    const project = process.env.RN_FIREBASE_PROJECT_ID;

    // =======================
    // GET SLUG (SOURCE OF TRUTH)
    // =======================
    const slug =
      event.queryStringParameters?.slug ||
      event.path?.split("/").filter(Boolean).pop();

    if (!slug) {
      return { statusCode: 400, body: "Missing slug" };
    }

    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    // =======================
    // BOT DETECTION (ROBUST)
    // =======================
    const ua = (event.headers["user-agent"] || "").toLowerCase();

    const isBot =
      ua.includes("facebookexternalhit") ||
      ua.includes("facebot") ||
      ua.includes("facebookplatform") ||
      ua.includes("meta-externalagent") ||
      ua.includes("meta-externalfetcher") ||
      ua.includes("twitterbot") ||
      ua.includes("whatsapp") ||
      ua.includes("linkedinbot") ||
      ua.includes("applebot");

    // =======================
    // FIRESTORE QUERY (FAST + RELIABLE)
    // =======================
    const url =
      `https://firestore.googleapis.com/v1/projects/${project}` +
      `/databases/(default)/documents:runQuery`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "businesses" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: cleanSlug }
            }
          },
          limit: 1
        }
      })
    });

    const rows = await res.json();
    const doc = rows.find((r) => r.document)?.document;

    if (!doc?.fields) {
      return { statusCode: 404, body: "Business not found" };
    }

    const f = doc.fields;

    const name = f.name?.stringValue || "Business";
    const description =
      f.description?.stringValue ||
      "Local business in Rhondda Cynon Taf";

    const category =
      f.category?.stringValue || "Local Business";

    const town =
      f.town?.stringValue || "";

    const finalUrl = `${base}${path}`;

    const image =
      f.logo?.stringValue ||
      f.image?.stringValue ||
      `${base}/images/categories/default.webp`;

    // =======================
    // HUMAN USERS → SPA REDIRECT
    // =======================
    if (!isBot) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `
<!doctype html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/directory/business.html?slug=${cleanSlug}">
</head>
<body></body>
</html>
        `
      };
    }

    // =======================
    // BOT → OG TAGS
    // =======================
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">

  <title>${escapeHtml(name)}</title>

  <meta property="og:title" content="${escapeHtml(name)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="https://rctx.co.uk/.netlify/functions/og-image?slug=${cleanSlug}">
  <meta property="og:url" content="${finalUrl}">
  <meta property="og:type" content="website">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(name)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://rctx.co.uk/.netlify/functions/og-image?slug=${cleanSlug}">
</head>

<body></body>
</html>
      `
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Server error" };
  }
};
