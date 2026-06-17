const fetch = require("node-fetch");
const { Resvg } = require("@resvg/resvg-js");
const path = require("path");

// ================================
// FONT
// ================================
const FONT_FILE = path.resolve(
  __dirname,
  "../fonts/Inter-Bold.ttf"
);

// ================================
// ESCAPE HTML
// ================================
function escape(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ================================
// SPLIT TITLE
// ================================
function splitTitle(title = "") {
  const words = title.trim().split(" ");
  if (words.length <= 2) return [title];

  const mid = Math.ceil(words.length / 2);

  return [
    words.slice(0, mid).join(" "),
    words.slice(mid).join(" ")
  ];
}

// ================================
// CATEGORY THEMES
// ================================
const categoryThemes = {
  Cleaning: { c1: "#0F766E", c2: "#14B8A6", glow: "#5EEAD4", icon: "✦" },
  Trades:   { c1: "#7C2D12", c2: "#F97316", glow: "#FDBA74", icon: "⬢" },
  Beauty:   { c1: "#9D174D", c2: "#EC4899", glow: "#F9A8D4", icon: "✿" },
  Food:     { c1: "#581C87", c2: "#A855F7", glow: "#D8B4FE", icon: "✺" },
  Tech:     { c1: "#1D4ED8", c2: "#38BDF8", glow: "#93C5FD", icon: "◈" }
};

// ================================
// MAIN HANDLER
// ================================
exports.handler = async (event) => {
  try {
    const project = process.env.RN_FIREBASE_PROJECT_ID;
    const slug = event.queryStringParameters?.slug;

    if (!slug) {
      return { statusCode: 400, body: "Missing slug" };
    }

    // ================================
    // FIRESTORE QUERY (FAST + CLEAN)
    // ================================
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
              value: { stringValue: slug }
            }
          },
          limit: 1
        }
      })
    });

    const rows = await res.json();

    const doc = rows.find(r => r.document)?.document;

    if (!doc?.fields) {
      return { statusCode: 404, body: "Business not found" };
    }

    const f = doc.fields;

    // ================================
    // BUSINESS OBJECT
    // ================================
    const business = {
      name: f.name?.stringValue || "Business",
      category: f.category?.stringValue || "Local Business",
      town: f.town?.stringValue || "South Wales"
    };

    // ================================
    // THEME
    // ================================
    const theme =
      categoryThemes[business.category] || {
        c1: "#111827",
        c2: "#2563EB",
        glow: "#60A5FA",
        icon: "◆"
      };

    const lines = splitTitle(business.name);

    // ================================
    // SVG
    // ================================
    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">

<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.c1}" />
    <stop offset="100%" stop-color="${theme.c2}" />
  </linearGradient>

  <radialGradient id="glow">
    <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>
  </radialGradient>

  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
    <stop offset="100%" stop-color="rgba(255,255,255,0.04)" />
  </linearGradient>

  <filter id="blur"><feGaussianBlur stdDeviation="40"/></filter>

  <filter id="shadow">
    <feDropShadow dx="0" dy="12" stdDeviation="24" flood-opacity="0.25"/>
  </filter>

  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.06"/>
    </feComponentTransfer>
  </filter>
</defs>

<rect width="1200" height="630" fill="url(#bg)"/>

<circle cx="980" cy="140" r="240" fill="url(#glow)" filter="url(#blur)"/>
<circle cx="150" cy="560" r="180" fill="rgba(255,255,255,0.08)" filter="url(#blur)"/>

<rect width="1200" height="630" filter="url(#noise)" opacity="0.45"/>

<rect x="40" y="40" width="1120" height="550" rx="34"
fill="url(#glass)" stroke="rgba(255,255,255,0.12)" filter="url(#shadow)"/>

<!-- TITLE -->
<text x="70" y="240" font-family="Inter" font-size="92" font-weight="700" fill="#fff">
  ${
    lines.map((l,i)=>`
      <tspan x="70" dy="${i===0?0:102}">${escape(l)}</tspan>
    `).join("")
  }
</text>

<!-- SUBTITLE -->
<text x="72" y="430" font-family="Inter" font-size="40" fill="rgba(255,255,255,0.84)">
  ${escape(business.category)} • ${escape(business.town)}
</text>

</svg>
`;

    // ================================
    // RENDER IMAGE
    // ================================
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
    console.error(err);
    return { statusCode: 500, body: "Image generation error" };
  }
};
