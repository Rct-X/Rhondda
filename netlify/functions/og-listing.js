const fetch = require("node-fetch");

// ----------------------
// Helper: safe HTML escape
// ----------------------
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

exports.handler = async (event) => {
  try {
    const base = "https://rctx.co.uk";
    const project = process.env.RN_FIREBASE_PROJECT_ID;

    // ----------------------
    // BOT DETECTION
    // ----------------------
    const ua = event.headers["user-agent"] || "";
    const isBot =
      ua.includes("facebookexternalhit") ||
      ua.includes("Twitterbot") ||
      ua.includes("WhatsApp") ||
      ua.includes("LinkedInBot") ||
      ua.includes("Applebot");

    // ----------------------
    // Extract path
    // ----------------------
    const fullUrl = event.rawUrl || "";
    const match = fullUrl.match(/\/directory\/.*$/);

    if (!match) {
      return { statusCode: 400, body: "Invalid directory URL" };
    }

    const path = match[0];
    const parts = path.split("/").filter(Boolean);

    const categorySlug = parts[1];
    const townSlug = parts[2];
    const businessSlug = parts[3];

    if (!businessSlug) {
      return { statusCode: 400, body: "Missing business slug" };
    }

    // ----------------------
    // Firestore REST API
    // ----------------------
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/businesses`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.documents) {
      return { statusCode: 404, body: "No businesses found" };
    }

    let business = null;

    data.documents.forEach((doc) => {
      const f = doc.fields;
      if (f.slug?.stringValue === businessSlug) {
        business = {
          name: f.name?.stringValue,
          description: f.description?.stringValue,
          image: f.image?.stringValue,
          logo: f.logo?.stringValue,
        };
      }
    });

    if (!business) {
      return { statusCode: 404, body: "Business not found" };
    }

    const title = escapeHtml(business.name || "RCTX Listing");
    const description = escapeHtml(
      business.description ||
        `Find ${categorySlug.replace(/-/g, " ")} in ${townSlug.replace(/-/g, " ")} on RCTX`
    );

    const image =
      business.logo ||
      business.image ||
      `${base}/images/categories/${categorySlug}.webp`;

    const finalUrl = `${base}${path}`;

    // ----------------------
    // HUMAN VISITOR → REDIRECT TO REAL PAGE
    // ----------------------
    if (!isBot) {
      return {
        statusCode: 302,
        headers: { Location: finalUrl },
      };
    }

    // ----------------------
    // BOT → RETURN OG HTML
    // ----------------------
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: `
<!DOCTYPE html>
<html>
<head>
<title>${title}</title>

<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${finalUrl}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">
</head>
<body></body>
</html>
`,
    };
  } catch (err) {
    return { statusCode: 500, body: "Server error" };
  }
};
