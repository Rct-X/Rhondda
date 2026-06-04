// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  console.log("🔧 Fetching Firebase config…");
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;
let currentBusiness = null;

// ===============================
// READ URL PATH PARAMETERS
// ===============================
function getPathParams() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const params = {
    category: parts[1],
    town: parts[2],
    slug: parts[3]
  };
  console.log("📌 URL Params:", params);
  return params;
}

// ===============================
// SHARE POPUP ELEMENTS
// ===============================
const sharePopup = document.getElementById("sharePopup");
const closeSharePopupBtn = document.getElementById("closeSharePopup");

console.log("🔍 sharePopup =", sharePopup);
console.log("🔍 closeSharePopupBtn =", closeSharePopupBtn);

// Close popup
closeSharePopupBtn?.addEventListener("click", () => {
  console.log("❌ Popup closed via button");
  sharePopup?.classList.remove("show");
});

// Close popup when clicking background
sharePopup?.addEventListener("click", (e) => {
  if (e.target === sharePopup) {
    console.log("❌ Popup closed via background click");
    sharePopup.classList.remove("show");
  }
});

// ===============================
// POPUP TIMER (SHOW AFTER 6s)
// ===============================
console.log("⏳ Popup timer started…");

setTimeout(() => {
  console.log("⏳ 6 seconds passed — checking popup conditions…");

  if (sessionStorage.getItem("sharePopupShown")) {
    console.log("⚠️ Popup already shown this session — skipping");
    return;
  }

  if (!sharePopup) {
    console.log("❌ sharePopup element NOT FOUND — cannot show popup");
    return;
  }

  console.log("✅ Showing popup now");
  sharePopup.classList.add("show");
  sessionStorage.setItem("sharePopupShown", "true");

}, 6000);

// ===============================
// INIT FIREBASE + LOAD BUSINESS
// ===============================
(async () => {
  try {
    const config = await loadFirebaseConfig();
    console.log("🔥 Firebase config loaded");

    firebase.initializeApp(config);
    db = firebase.firestore();
    console.log("🔥 Firebase initialized");

    const page = getPathParams();

    if (!page.category || !page.town || !page.slug) {
      console.error("❌ Missing URL parameters");
      return;
    }

    loadBusiness(page.category, page.town, page.slug);

  } catch (err) {
    console.error("❌ Firebase init error:", err);
  }
})();

// ===============================
// LOAD BUSINESS DATA
// ===============================
async function loadBusiness(categorySlug, townSlug, slug) {
  console.log("📥 Loading business:", categorySlug, townSlug, slug);

  const q = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("slug", "==", slug);

  const snap = await q.get();

  if (snap.empty) {
    console.log("❌ Business not found");
    setText("businessName", "Business Not Found");
    return;
  }

  const b = snap.docs[0].data();
  currentBusiness = b;
  window.currentBusiness = b;

  console.log("✅ Business loaded:", b);

  // SEO
  document.title = `${b.name} | ${b.town} ${b.category} | RCTX Directory`;

  // UNIVERSAL OG IMAGE
  const ogTag = document.getElementById("ogImage");
  if (ogTag) {
    ogTag.setAttribute("content", "https://rctx.co.uk/images/find-rctx.jpg");
    console.log("🖼 OG image set");
  } else {
    console.log("⚠️ ogImage tag missing in HTML");
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');
  ogUrl?.setAttribute("content", window.location.href);

  const canonical = document.querySelector('link[rel="canonical"]');
  canonical?.setAttribute("href", window.location.href);

  // MAIN CONTENT
  setText("businessName", b.name);
  setText("businessCategory", b.category);
  setText("businessTown", b.town);
  setText("businessDescription", b.description || "No description provided.");
  setText("businessPhone", b.phone || "Not provided");
  setText("businessAddress", b.address || "Not provided");

  // WEBSITE
  const websiteEl = document.getElementById("businessWebsite");
  if (websiteEl) {
    if (b.website) {
      websiteEl.textContent = b.website;
      websiteEl.href = b.website.startsWith("http") ? b.website : `https://${b.website}`;
    } else {
      websiteEl.textContent = "Not provided";
      websiteEl.removeAttribute("href");
    }
  }

  // SIDEBAR
  setText("businessTownSidebar", b.town);
  setText("businessCategorySidebar", b.category);

  // BADGES
  if (b.verified) {
    setHTML("verifiedBadge", `<span class="badge badge-verified">Verified</span>`);
  }

  if (b.ownerId) {
    setHTML("claimedBadge", `<span class="badge badge-claimed">Claimed</span>`);
    setText("claimedMessage", "This business listing has been claimed by the owner.");
  }

  // HOURS
  const hoursList = document.getElementById("businessHours");
  if (hoursList) {
    hoursList.innerHTML = "";

    if (b.hours) {
      Object.entries(b.hours).forEach(([day, hours]) => {
        const li = document.createElement("li");
        li.textContent = `${day}: ${hours}`;
        hoursList.appendChild(li);
      });
    } else {
      hoursList.innerHTML = "<li>No hours provided.</li>";
    }
  }

  // CLAIM BUTTON
  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) {
    if (b.ownerId) {
      claimBtn.style.display = "none";
    } else {
      claimBtn.href = `/claim-business?b=${b.slug}`;
    }
  }

  loadRelated(b.categorySlug, b.townSlug, b.slug);
}

// ===============================
// RELATED BUSINESSES
// ===============================
async function loadRelated(categorySlug, townSlug, currentSlug) {
  console.log("🔎 Loading related businesses…");

  const relatedGrid = document.getElementById("relatedGrid");
  if (!relatedGrid) return;

  relatedGrid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  const q1 = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug);

  const snap1 = await q1.get();
  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

  if (results.length < 4) {
    const q2 = db.collection("businesses")
      .where("categorySlug", "==", categorySlug);

    const snap2 = await q2.get();
    snap2.forEach(doc => {
      const b = doc.data();
      if (b.slug !== currentSlug && !results.some(r => r.slug === b.slug)) {
        results.push(b);
      }
    });
  }

  results = results.slice(0, 4);

  if (results.length === 0) {
    relatedGrid.innerHTML = `<p>No similar businesses found.</p>`;
    return;
  }

  relatedGrid.innerHTML = "";

  results.forEach(b => {
    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
    card.className = "related-card";

    card.innerHTML = `
      <h3>${b.name}</h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
    `;

    relatedGrid.appendChild(card);
  });

  console.log("✅ Related businesses loaded");
}

// ===============================
// SHARE SYSTEM
// ===============================
document.addEventListener("click", async (e) => {
  const shareBtn = e.target.closest("#shareBusinessBtn");
  if (!shareBtn) return;

  console.log("📤 Share button clicked");

  const b = window.currentBusiness;

  if (!b) {
    console.log("❌ No business loaded yet — cannot share");
    return;
  }

  const shareData = {
    title: `${b.name} – ${b.category} in ${b.town}`,
    text: b.description || `Check out ${b.name} on RCTX`,
    url: window.location.href
  };

  console.log("📄 shareData =", shareData);

  // MOBILE SHARE
  if (navigator.share) {
    console.log("📱 Using navigator.share()");
    try {
      await navigator.share(shareData);
      console.log("✅ Share successful");
      sharePopup?.classList.remove("show");
    } catch (err) {
      console.log("⚠️ Share cancelled or failed:", err);
    }
    return;
  }

  // FALLBACK COPY
  console.log("📝 Using fallback copy");
  try {
    await navigator.clipboard.writeText(window.location.href);
    console.log("📋 Link copied to clipboard");

    shareBtn.textContent = "Link Copied!";
    setTimeout(() => {
      shareBtn.textContent = "Share This Business";
    }, 2000);

  } catch (err) {
    console.log("❌ Clipboard copy failed:", err);
    window.prompt("Copy link:", window.location.href);
  }
});

// ===============================
// HELPERS
// ===============================
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHTML(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = value;
                          }
