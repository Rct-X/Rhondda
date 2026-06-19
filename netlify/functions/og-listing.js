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
    // GET SLUG
    // =======================
    const slug =
      event.queryStringParameters?.slug ||
      event.path?.split("/").filter(Boolean).pop();

    if (!slug) {
      return {
        statusCode: 400,
        body: "Missing slug"
      };
    }

    const cleanSlug = decodeURIComponent(slug)
      .toLowerCase()
      .trim();

    // =======================
    // BOT DETECTION
    // =======================
    const ua = (
      event.headers["user-agent"] ||
      ""
    ).toLowerCase();

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
    // FIRESTORE QUERY
    // =======================
    const firestoreUrl =
      `https://firestore.googleapis.com/v1/projects/${project}` +
      `/databases/(default)/documents:runQuery`;

    const res = await fetch(firestoreUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        structuredQuery: {
          from: [
            {
              collectionId: "businesses"
            }
          ],
          where: {
            fieldFilter: {
              field: {
                fieldPath: "slug"
              },
              op: "EQUAL",
              value: {
                stringValue: cleanSlug
              }
            }
          },
          limit: 1
        }
      })
    });

    const rows = await res.json();

    console.log("SLUG LOOKUP:", cleanSlug);
console.log(JSON.stringify(rows, null, 2));

    const doc =
      rows.find(r => r.document)?.document;

    if (!doc?.fields) {
      return {
        statusCode: 404,
        body: "Business not found"
      };
    }

    const f = doc.fields;

    // =======================
    // BUSINESS DATA
    // =======================
    const name =
      f.name?.stringValue ||
      "Business";

    const description =
      f.description?.stringValue ||
      "Local business in Rhondda Cynon Taf";

    const categorySlug =
      f.categorySlug?.stringValue || "";

    const townSlug =
      f.townSlug?.stringValue || "";

    const finalUrl =
      `${base}/directory/${categorySlug}/${townSlug}/${cleanSlug}`;

    // =======================
// HUMAN VISITOR
// =======================
if (!isBot) {
  const fs = require("fs");
  const path = require("path");

  const filePath = path.join(__dirname, "../../directory/business.html");
  const html = fs.readFileSync(filePath, "utf8");

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    body: html
  };
}
    // =======================
    // BOT OG TAGS
    // =======================
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html"
      },
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

    return {
      statusCode: 500,
      body: "Server error"
    };
  }
};
