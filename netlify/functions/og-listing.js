const admin = require("firebase-admin");

// ----------------------
// Firebase Init
// ----------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

// ----------------------
// Helper: safe HTML escape (prevents broken meta tags)
// ----------------------
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------------
// Handler
// ----------------------
exports.handler = async (event) => {
  try {
    let path = event.path || "";

    console.log("OG FUNCTION HIT:", path);

    // Remove Netlify function prefix if present
    path = path.replace("/.netlify/functions/og-listing", "");

    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    // Expected:
    // /directory/category/town/business
    const parts = path.split("/").filter(Boolean);

    const categorySlug = parts[1] || parts[0] || "";
    const townSlug = parts[2] || "";
    const businessSlug = parts[3] || parts[2] || parts[1] || parts[0] || "";

    console.log("PARSED:", {
      categorySlug,
      townSlug,
      businessSlug
    });

    if (!businessSlug) {
      return {
        statusCode: 400,
        body: "Invalid URL structure"
      };
    }

    // ----------------------
    // Firestore lookup (safe + simple scan version)
    // ----------------------
    const snap = await db.collection("businesses").get();

    let business = null;

    snap.forEach((doc) => {
      const data = doc.data();

      if (data.slug === businessSlug) {
        business = data;
      }
    });

    if (!business) {
      console.log("NO MATCH FOUND:", businessSlug);

      return {
        statusCode: 404,
        body: `Business not found: ${businessSlug}`
      };
    }

    console.log("BUSINESS FOUND:", business.name);

    // ----------------------
    // OG VALUES
    // ----------------------
    const title = escapeHtml(business.name || "RCTX Listing");

    const description = escapeHtml(
      business.description ||
      `Find ${categorySlug.replace(/-/g, " ")} in ${townSlug.replace(/-/g, " ")} on RCTX`
    );

    const image =
      business.logo ||
      business.image ||
      `https://rctx.co.uk/images/categories/${categorySlug}.webp`;

    const url = `https://rctx.co.uk${path}`;

    // ----------------------
    // Return HTML with OG tags
    // ----------------------
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html"
      },
      body: `
<!DOCTYPE html>
<html lang="en">
<head>

<title>${title}</title>

<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">

<meta name="twitter:card" content="summary_large_image">

</head>
<body>

<script>
  // redirect real users to frontend page
  window.location.href = "${url}";
</script>

</body>
</html>
`
    };

  } catch (err) {
    console.log("FUNCTION ERROR:", err);

    return {
      statusCode: 500,
      body: "Server error in OG function"
    };
  }
};
