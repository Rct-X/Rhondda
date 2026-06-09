const admin = require("firebase-admin");

// Init Firebase (safe guard so it doesn't re-init)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {

  const path = event.path;

  // /directory/category/town/business-slug
  const parts = path.split("/").filter(Boolean);

  const categorySlug = parts[1];
  const townSlug = parts[2];
  const businessSlug = parts[3];

  if (!businessSlug) {
    return {
      statusCode: 404,
      body: "Invalid URL"
    };
  }

  // Get business from Firestore
  const snap = await db
    .collection("businesses")
    .where("slug", "==", businessSlug)
    .limit(1)
    .get();

  if (snap.empty) {
    return {
      statusCode: 404,
      body: "Business not found"
    };
  }

  const business = snap.docs[0].data();

  // OG values
  const title = business.name || "RCTX Listing";

  const description =
    business.description ||
    `Find ${categorySlug.replace("-", " ")} in ${townSlug.replace("-", " ")} on RCTX`;

  const image =
    business.logo ||
    `https://rctx.co.uk/images/categories/${categorySlug}.webp`;

  const url = `https://rctx.co.uk${path}`;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/html"
    },
    body: `
<!DOCTYPE html>
<html>
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
};
