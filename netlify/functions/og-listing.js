const admin = require("firebase-admin");

// Init Firebase safely
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {

  const path = event.path || "";

  console.log("OG FUNCTION HIT:", path);

  // /directory/category/town/business-slug
  const parts = path.split("/").filter(Boolean);

  const categorySlug = parts[1] || "";
  const townSlug = parts[2] || "";
  const businessSlug = parts[3] || "";

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

  try {
    // STEP 1: pull all (DEBUG SAFE VERSION)
    const snap = await db.collection("businesses").get();

    let business = null;

    snap.forEach(doc => {
      const data = doc.data();

      if (data.slug === businessSlug) {
        business = data;
      }
    });

    // STEP 2: fallback check (sometimes slug is missing)
    if (!business) {
      console.log("NO MATCH FOUND FOR:", businessSlug);

      return {
        statusCode: 404,
        body: `Business not found: ${businessSlug}`
      };
    }

    console.log("BUSINESS FOUND:", business.name);

    // OG VALUES
    const title = business.name || "RCTX Listing";

    const description =
      business.description ||
      `Find ${categorySlug.replace("-", " ")} in ${townSlug.replace("-", " ")} on RCTX`;

    const image =
      business.logo ||
      business.image ||
      `https://rctx.co.uk/images/categories/${categorySlug}.webp`;

    const url = `https://rctx.co.uk${path}`;

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

<script>
window.location.href = "${url}";
</script>

</head>
<body></body>
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
