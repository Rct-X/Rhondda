const fetch = require("node-fetch");
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
const path = require("path");

// Load Inter Bold font
const FONT_FILE = path.resolve(__dirname, "../fonts/Inter-Bold.ttf");

// Escape HTML
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

    // Fetch business
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

    // CATEGORY COLOURS
    const categoryColors = {
      "Cleaning": ["#4CAF50", "#2E7D32"],
      "Trades": ["#FF9800", "#F57C00"],
      "Beauty": ["#E91E63", "#AD1457"],
      "Food": ["#9C27B0", "#6A1B9A"],
      "Tech": ["#2196F3", "#1565C0"],
    };

    const [c1, c2] = categoryColors[business.category] || ["#1B2B5A", "#3A6EA5"];

    // SVG TEMPLATE
    const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">

<style>
  .title {
    font-family: Inter;
    font-size: 80px;
    font-weight: 700;
    fill: white;
    filter: url(#softGlow);
  }

  .sub {
    font-family: Inter;
    font-size: 42px;
    fill: #E3E9F0;
  }

  .brand {
    font-family: Inter;
    font-size: 34px;
    fill: #C7D4E5;
  }

  .cta {
    font-family: Inter;
    font-size: 36px;
    font-weight: 700;
    fill: #000;
  }
</style>

<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient>

  <filter id="softGlow">
    <feGaussianBlur stdDeviation="12" result="blur"/>
    <feMerge>
      <feMergeNode in="blur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>

<rect width="1200" height="630" fill="url(#bg)" rx="28"/>

<text x="60" y="200" class="title">${escape(business.name)}</text>

<text x="60" y="300" class="sub">
  ${escape(business.category)} in ${escape(business.town)}
</text>

<!-- CTA BUTTON -->
<rect x="60" y="480" width="380" height="90" rx="14" fill="#FFEB3B"/>
<text x="90" y="540" class="cta">View Business →</text>

<text x="60" y="610" class="brand">RCTX Directory</text>

</svg>
`;

    // Render PNG
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
      font: {
        loadSystemFonts: false,
        defaultFontFamily: "Inter",
        fontFiles: [FONT_FILE]
      }
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
