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
// EMBEDDED BUSINESS.HTML
// =======================
const BUSINESS_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>RCTX Business Network | Rhondda</title>
<meta name="description" content="View trusted local business information on the RCTX Local Network.">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" id="canonicalUrl" href="">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RCTX Local">
<meta property="og:title" content="RCTX Local Business | Network">
<meta property="og:description" content="Find trusted local businesses across Rhondda Cynon Taf.">
<meta property="og:url" id="ogUrl" content="">
<meta property="og:image" id="ogImage" content="https://rctx.co.uk/images/find-rctx.jpg">
<meta property="og:image:alt" content="Find local services in Rhondda Cynon Taf on RCTX Local">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="RCTX Local Business | Network">
<meta name="twitter:description" content="Find trusted local businesses across Rhondda Cynon Taf.">
<meta name="twitter:image" content="https://rctx.co.uk/images/find-rctx.jpg">
<meta name="prerender-status-code" content="200">

<link rel="stylesheet" href="/css/business.css">
<link rel="stylesheet" href="/css/nav.css">
<link rel="stylesheet" href="/css/mainBusiness.css">
<script defer src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
<script defer src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
</head>

<body class="business-page">


<main>

<section class="business-header">
  <div class="container">
    <img id="businessLogo" class="biz-logo" src="/images/placeholder-logo.webp" alt="" loading="lazy">
    <h1 id="businessName">Business Name</h1>
    <p class="business-subtitle">Local <span id="businessCategoryInline"></span> in <span id="businessTownInline"></span></p>
    <p class="business-meta">
      <span id="verifiedBadge"></span>
      <span id="claimedBadge"></span>
    </p>
  </div>
</section>

<section class="business-content">
  <div class="container">

    <div id="galleryWrapper">
      <div id="galleryScroller"></div>
      <div id="galleryCounter"></div>
    </div>

    <div class="quick-actions">
      <a id="businessPhoneBtn" class="qa-btn">Call</a>
      <a id="businessWebsiteBtn" class="qa-btn" target="_blank">Website</a>
      <a class="qa-btn" onclick="copyBusinessLink()">Copy Link</a>
    </div>

    <div class="business-info">
      <h2>About</h2>
      <p id="businessDescription">Loading…</p>

      <h3>Contact</h3>
      <ul class="business-contact">
        <li><strong>Phone:</strong> <span id="businessPhone"></span></li>
        <li><strong>Website:</strong> <a id="businessWebsite" href="#" target="_blank"></a></li>
        <li><strong>Address:</strong> <span id="businessAddress"></span></li>
      </ul>

      <h3>Opening Hours</h3>
      <ul id="businessHours" class="business-hours"></ul>
    </div>

    <div id="mapBox" class="map-box">
      <h3 id="locationTitle">Visit Us</h3>
      <p id="locationSubtext"></p>
      <div id="map"></div>
    </div>

    <aside class="business-sidebar">
      <div class="business-card">
        <h3>Location</h3>
        <p id="businessTownSidebar"></p>
      </div>

      <div class="business-card">
        <h3>Category</h3>
        <p id="businessCategorySidebar"></p>
      </div>

      <div class="business-card">
        <h3>Claim This Business</h3>
        <a href="#" id="claimBtn" class="btn btn-primary">Claim Listing</a>
        <p id="claimedMessage" class="claimed-message"></p>
      </div>

      <div class="business-card" id="viewsCard" style="display:none;">
        <h3>Popularity</h3>
        <p id="viewCountText"></p>
      </div>
    </aside>
    </div>
    <div class="share-wow">
      <div class="share-content">
        <h3>✨ Found Them on RCTX? ✨</h3>
        <p>Let the business know you discovered them here — it helps local businesses grow.</p>
        <button class="share-wow-btn" onclick="shareBusiness()">Share this business</button>
        <div class="share-credit">Powered by RCTX Web Design</div>
      </div>

  </div>
</section>

<section class="business-related">
  <div class="container">
    <h2>You May Also Like</h2>
    <p class="text-dim">Similar businesses in your area</p>
    <div id="relatedGrid" class="related-grid"></div>
  </div>

</section>


<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <div class="footer-logo">RCT<span>X</span></div>
      <p>Modern websites for businesses across Rhondda Cynon Taf.</p>
    </div>

    <div class="footer-contact">
      <h3>Contact</h3>
      <a href="tel:+447434745240">07434 745240</a>
      <a href="mailto:support@rctx.co.uk">support@rctx.co.uk</a>
      <a href="https://wa.me/447434745240" class="footer-cta-mobile">Message Eddie Directly</a>
    </div>

    <div class="footer-links">
      <h3>Legal</h3>
      <a href="/policy/privacy-policy.html">Privacy Policy</a>
      <a href="/policy/terms.html">Terms & Conditions</a>
    </div>
  </div>

  <div class="footer-bottom">
    © <span id="year"></span> RCTX • Web Design Rhondda Cynon Taf • All Rights Reserved
  </div>
</footer>
<script src="/js/nav.js"></script>
<script src="/js/map.js"></script>
<script defer src="/js/business.js?v=4"></script>
<script defer src="/js/footer-nav-faq.js"></script>
<script>window.RCTX_CLIENT_ID = "-MAIN SITE-";</script>
<script src="/js/rctx-tracker.js" defer></script>
<div id="toast" class="toast">Link copied!</div>
</body>
</html>
`;

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
      return { statusCode: 400, body: "Missing slug" };
    }

    const cleanSlug = decodeURIComponent(slug).toLowerCase().trim();

    // =======================
    // BOT DETECTION
    // =======================
    const ua = (event.headers["user-agent"] || "").toLowerCase();

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "businesses" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "slug" },
              op: "EQUAL",
              value: { stringValue: cleanSlug }
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

    const name = f.name?.stringValue || "Business";
    const description = f.description?.stringValue || "Local business in Rhondda Cynon Taf";
    const categorySlug = f.categorySlug?.stringValue || "";
    const townSlug = f.townSlug?.stringValue || "";

    const finalUrl = `${base}/local/${categorySlug}/${townSlug}/${cleanSlug}`;

    // =======================
    // HUMAN VISITOR
    // =======================
    if (!isBot) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: BUSINESS_HTML
      };
    }

    // =======================
    // BOT OG TAGS
    // =======================
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
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
    return { statusCode: 500, body: "Server error" };
  }
};
