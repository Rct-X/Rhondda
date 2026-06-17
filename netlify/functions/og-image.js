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
    // FIRESTORE QUERY
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
    const lineHeight = lines.length > 1 ? 105 : 0; 

    // ================================
    // SVG (Enhanced For Clickability)
    // ================================
    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">

<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.c1}" />
    <stop offset="100%" stop-color="${theme.c2}" />
  </linearGradient>

  <radialGradient id="glow">
    <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.65"/>
    <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>
  </radialGradient>

  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
    <stop offset="100%" stop-color="rgba(255,255,255,0.03)" />
  </linearGradient>

  <linearGradient id="badge-bg" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
    <stop offset="100%" stop-color="rgba(255,255,255,0.08)" />
  </linearGradient>

  <filter id="blur"><feGaussianBlur stdDeviation="45"/></filter>

  <filter id="shadow">
    <feDropShadow dx="0" dy="12" stdDeviation="24" flood-opacity="0.3" flood-color="#000000"/>
  </filter>

  <filter id="text-shadow">
    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.45"/>
  </filter>

  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.055"/>
    </feComponentTransfer>
  </filter>
</defs>

<!-- BACKGROUND -->
<rect width="1200" height="630" fill="url(#bg)"/>

<!-- GLOW EFFECTS -->
<circle cx="1020" cy="150" r="260" fill="url(#glow)" filter="url(#blur)"/>
<circle cx="200" cy="530" r="200" fill="rgba(255,255,255,0.06)" filter="url(#blur)"/>

<!-- NOISE TEXTURE -->
<rect width="1200" height="630" filter="url(#noise)" opacity="1"/>

<!-- GLASS CARD -->
<rect x="40" y="40" width="1120" height="550" rx="36"
fill="url(#glass)" stroke="rgba(255,255,255,0.14)" stroke-width="2" filter="url(#shadow)"/>

<!-- CARD INNER ACCENT LINE -->
<path d="M 40 290 L 1160 290" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

<!-- LOGO / WATERMARK BADGE -->
<g transform="translate(1000, 95)" filter="url(#shadow)">
  <circle cx="45" cy="45" r="50" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <text x="45" y="58" font-size="44" text-anchor="middle" fill="#FFFFFF">${theme.icon}</text>
</g>

<!-- TITLE -->
<text x="75" y="220" font-family="Inter" font-size="88" font-weight="700" fill="#FFFFFF" filter="url(#text-shadow)" letter-spacing="-1">
  ${
    lines.map((l,i)=>`
      <tspan x="75" dy="${i===0 ? 0 : lineHeight}">${escape(l)}</tspan>
    `).join("")
  }
</text>

<!-- CATEGORY AND TOWN BADGE -->
<g transform="translate(75, 420)">
  <!-- Capsule Background -->
  <rect x="0" y="0" width="auto" height="60" rx="30" fill="url(#badge-bg)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
  <!-- Text inside Capsule -->
  <text x="32" y="38" font-family="Inter" font-weight="600" font-size="24" fill="#FFFFFF" letter-spacing="0.5">
    ${theme.icon}  <tspan font-weight="400" fill="rgba(255,255,255,0.95)">${escape(business.category)}</tspan>  <tspan fill="rgba(255,255,255,0.5)">•</tspan>  <tspan font-weight="500" fill="rgba(255,255,255,0.85)">${escape(business.town)}</tspan>
  </text>
</g>

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
