const fetch = require("node-fetch");
const { Resvg } = require("@resvg/resvg-js");

// ----------------------
// Helper: escape HTML
// ----------------------
function escape(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.handler = async (event) => {
  try {
    const project = process.env.RN_FIREBASE_PROJECT_ID;

    const slug = event.queryStringParameters.slug;
    if (!slug) {
      return { statusCode: 400, body: "Missing slug" };
    }

    // ----------------------
    // Fetch business
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
      if (f.slug?.stringValue === slug) {
        business = {
          name: f.name?.stringValue || "",
          category: f.category?.stringValue || "",
          town: f.town?.stringValue || "",
        };
      }
    });

    if (!business) {
      return { statusCode: 404, body: "Business not found" };
    }

    // ----------------------
    // SVG TEMPLATE
    // ----------------------
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A1A2F"/>
      <stop offset="100%" stop-color="#1E3A5F"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" rx="20"/>

  <text x="60" y="200"
        font-size="70"
        font-family="Arial, sans-serif"
        fill="white"
        font-weight="700">
    ${escape(business.name)}
  </text>

  <text x="60" y="300"
        font-size="40"
        font-family="Arial, sans-serif"
        fill="#D0D8E0">
    ${escape(business.category)} in ${escape(business.town)}
  </text>

  <text x="60" y="580"
        font-size="32"
        font-family="Arial, sans-serif"
        fill="#8FA3B8">
    RCTX Directory
  </text>
</svg>
`;

    // ----------------------
    // Render PNG
    // ----------------------
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 }
    });

    const png = resvg.render().asPng();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400"
      },
      body: png.toString("base64"),
      isBase64Encoded: true
    };

  } catch (err) {
    return { statusCode: 500, body: "Image generation error" };
  }
};
