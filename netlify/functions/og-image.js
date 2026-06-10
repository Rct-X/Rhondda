const fetch = require("node-fetch");
const { Resvg } = require("@resvg/resvg-js");
const fs = require("fs");
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
// SPLIT TITLE INTO MULTILINE
// ================================
function splitTitle(title = "") {
  const words = title.trim().split(" ");

  if (words.length <= 2) {
    return [title];
  }

  const middle = Math.ceil(words.length / 2);

  return [
    words.slice(0, middle).join(" "),
    words.slice(middle).join(" ")
  ];
}

// ================================
// CATEGORY THEMES
// ================================
const categoryThemes = {
  Cleaning: {
    c1: "#0F766E",
    c2: "#14B8A6",
    glow: "#5EEAD4",
    icon: "✦"
  },

  Trades: {
    c1: "#7C2D12",
    c2: "#F97316",
    glow: "#FDBA74",
    icon: "⬢"
  },

  Beauty: {
    c1: "#9D174D",
    c2: "#EC4899",
    glow: "#F9A8D4",
    icon: "✿"
  },

  Food: {
    c1: "#581C87",
    c2: "#A855F7",
    glow: "#D8B4FE",
    icon: "✺"
  },

  Tech: {
    c1: "#1D4ED8",
    c2: "#38BDF8",
    glow: "#93C5FD",
    icon: "◈"
  }
};

// ================================
// HANDLER
// ================================
exports.handler = async (event) => {
  try {

    const project = process.env.RN_FIREBASE_PROJECT_ID;

    const slug = event.queryStringParameters.slug;

    if (!slug) {
      return {
        statusCode: 400,
        body: "Missing slug"
      };
    }

    // ================================
    // FETCH FIREBASE DATA
    // ================================
    const url =
      `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/businesses`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.documents) {
      return {
        statusCode: 404,
        body: "No businesses found"
      };
    }

    let business = null;

    data.documents.forEach((doc) => {

      const f = doc.fields;

      if (f.slug?.stringValue === slug) {

        business = {
          name: f.name?.stringValue || "Business",
          category: f.category?.stringValue || "Local Business",
          town: f.town?.stringValue || "South Wales"
        };

      }

    });

    if (!business) {
      return {
        statusCode: 404,
        body: "Business not found"
      };
    }

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
<svg
  width="1200"
  height="630"
  viewBox="0 0 1200 630"
  xmlns="http://www.w3.org/2000/svg"
>

<defs>

  <!-- Background Gradient -->
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${theme.c1}" />
    <stop offset="100%" stop-color="${theme.c2}" />
  </linearGradient>

  <!-- Light Glow -->
  <radialGradient id="glow">
    <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>
  </radialGradient>

  <!-- Glass -->
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.14)" />
    <stop offset="100%" stop-color="rgba(255,255,255,0.04)" />
  </linearGradient>

  <!-- Soft Blur -->
  <filter id="blur">
    <feGaussianBlur stdDeviation="40"/>
  </filter>

  <!-- Shadow -->
  <filter id="shadow">
    <feDropShadow
      dx="0"
      dy="12"
      stdDeviation="24"
      flood-opacity="0.25"
    />
  </filter>

  <!-- Grain -->
  <filter id="noise">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.8"
      numOctaves="2"
      stitchTiles="stitch"
    />
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer>
      <feFuncA type="table" tableValues="0 0.06"/>
    </feComponentTransfer>
  </filter>

</defs>

<!-- Background -->
<rect
  width="1200"
  height="630"
  fill="url(#bg)"
/>

<!-- Glow Effects -->
<circle
  cx="980"
  cy="140"
  r="240"
  fill="url(#glow)"
  filter="url(#blur)"
/>

<circle
  cx="150"
  cy="560"
  r="180"
  fill="rgba(255,255,255,0.08)"
  filter="url(#blur)"
/>

<!-- Decorative Shapes -->
<g opacity="0.08">

  <circle cx="1040" cy="120" r="120" fill="#fff"/>
  <circle cx="980" cy="240" r="40" fill="#fff"/>

  <circle cx="920" cy="180" r="18" fill="#fff"/>
  <circle cx="860" cy="120" r="12" fill="#fff"/>

</g>

<!-- Grain -->
<rect
  width="1200"
  height="630"
  filter="url(#noise)"
  opacity="0.45"
/>

<!-- Main Glass Card -->
<rect
  x="40"
  y="40"
  width="1120"
  height="550"
  rx="34"
  fill="url(#glass)"
  stroke="rgba(255,255,255,0.12)"
  filter="url(#shadow)"
/>

<!-- Accent Border -->
<rect
  x="40"
  y="40"
  width="1120"
  height="550"
  rx="34"
  fill="none"
  stroke="rgba(255,255,255,0.06)"
  stroke-width="2"
/>

<!-- Category Badge -->
<rect
  x="70"
  y="70"
  width="310"
  height="54"
  rx="27"
  fill="rgba(255,255,255,0.12)"
  stroke="rgba(255,255,255,0.10)"
/>

<text
  x="96"
  y="106"
  font-family="Inter"
  font-size="28"
  font-weight="700"
  fill="#fff"
>
  ${theme.icon}
</text>

<text
  x="136"
  y="106"
  font-family="Inter"
  font-size="24"
  font-weight="700"
  fill="#fff"
  letter-spacing="1"
>
  VERIFIED LOCAL BUSINESS
</text>

<!-- TITLE -->
<text
  x="70"
  y="240"
  font-family="Inter"
  font-size="92"
  font-weight="700"
  fill="#fff"
  letter-spacing="-3"
>

  ${
    lines.map((line, i) => `
      <tspan
        x="70"
        dy="${i === 0 ? 0 : 102}"
      >
        ${escape(line)}
      </tspan>
    `).join("")
  }

</text>

<!-- Subtitle -->
<text
  x="72"
  y="430"
  font-family="Inter"
  font-size="40"
  fill="rgba(255,255,255,0.84)"
>
  ${escape(business.category)}
  •
  ${escape(business.town)}
</text>

<!-- Bottom Branding -->
<text
  x="70"
  y="555"
  font-family="Inter"
  font-size="28"
  fill="rgba(255,255,255,0.72)"
  letter-spacing="2"
>
  RCTX.CO.UK
</text>

<!-- Right Side Large Symbol -->
<text
  x="940"
  y="470"
  font-family="Inter"
  font-size="240"
  font-weight="700"
  fill="rgba(255,255,255,0.08)"
>
  ${theme.icon}
</text>

<!-- Decorative Line -->
<rect
  x="70"
  y="465"
  width="180"
  height="6"
  rx="3"
  fill="rgba(255,255,255,0.42)"
/>

</svg>
`;

    // ================================
    // RENDER PNG
    // ================================
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: "width",
        value: 1200
      },

      font: {
        loadSystemFonts: false,
        defaultFontFamily: "Inter",
        fontFiles: [FONT_FILE]
      }
    });

    const png = resvg.render().asPng();

    // ================================
    // RESPONSE
    // ================================
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

    return {
      statusCode: 500,
      body: "Image generation error"
    };

  }
};
