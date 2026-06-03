// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  console.log("🔥 Fetching Firebase config...");
  const res = await fetch("/.netlify/functions/firebaseConfig");
  const json = await res.json();
  console.log("🔥 Firebase config loaded:", json);
  return json;
}

let db;

// ===============================
// INIT FIREBASE + LOAD BUSINESS
// ===============================
(async () => {
  console.log("🚀 Initialising Firebase...");
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  db = firebase.firestore();
  console.log("🔥 Firestore initialised:", db);

  const page = detectBusinessURL();
  console.log("📌 detectBusinessURL() returned:", page);

  if (page.type === "business") {
    console.log("📥 Loading business:", page);
    loadBusiness(page.category, page.town, page.slug);
  } else {
    console.warn("❌ Not a business page. Page type:", page.type);
  }
})();

// ===============================
// URL PARSER
// ===============================
function detectBusinessURL() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  console.log("🔍 URL parts:", parts);

  if (parts.length === 4 && parts[0] === "directory") {
    console.log("✅ Business URL detected");
    return {
      type: "business",
      category: parts[1],
      town: parts[2],
      slug: parts[3].replace(".html", "")
    };
  }

  console.warn("❌ URL does NOT match business pattern");
  return { type: "unknown" };
}

// ===============================
// LOAD BUSINESS DATA
// ===============================
async function loadBusiness(categorySlug, townSlug, slug) {
  console.log("📡 Querying Firestore for:", { categorySlug, townSlug, slug });

  const q = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("slug", "==", slug);

  const snap = await q.get();
  console.log("📡 Firestore response:", snap);

  if (snap.empty) {
    console.error("❌ No business found in Firestore for:", { categorySlug, townSlug, slug });
    document.getElementById("businessName").textContent = "Business Not Found";
    return;
  }

  const b = snap.docs[0].data();
  console.log("✅ Business found:", b);

  // ===============================
  // SET CANONICAL URL
  // ===============================
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.href = `https://rctx.co.uk/directory/${b.categorySlug}/${b.townSlug}/${b.slug}.html`;
    console.log("🔗 Canonical set:", canonical.href);
  }

  // ===============================
  // INJECT SEO
  // ===============================
  console.log("📝 Injecting SEO...");
  document.title = `${b.name} | ${b.town} ${b.category} | RCTX Directory`;

  const seoDesc = document.getElementById("seoDescription");
  if (seoDesc) {
    seoDesc.setAttribute("content", `${b.name} in ${b.town}. Local ${b.category} serving Rhondda Cynon Taf.`);
  } else {
    console.warn("⚠️ Missing #seoDescription element");
  }

  // ===============================
  // INJECT MAIN CONTENT
  // ===============================
  console.log("📝 Injecting main content...");
  document.getElementById("businessName").textContent = b.name;
  document.getElementById("businessCategory").textContent = b.category;
  document.getElementById("businessTown").textContent = b.town;
  document.getElementById("businessDescription").textContent =
    b.description || "No description provided.";

  document.getElementById("businessPhone").textContent = b.phone || "Not provided";
  document.getElementById("businessAddress").textContent = b.address || "Not provided";

  const websiteEl = document.getElementById("businessWebsite");
  if (b.website) {
    websiteEl.textContent = b.website;
    websiteEl.href = b.website.startsWith("http")
      ? b.website
      : `https://${b.website}`;
  } else {
    websiteEl.textContent = "Not provided";
    websiteEl.removeAttribute("href");
  }

  // ===============================
  // SIDEBAR
  // ===============================
  console.log("📌 Updating sidebar...");
  document.getElementById("businessTownSidebar").textContent = b.town;
  document.getElementById("businessCategorySidebar").textContent = b.category;

  // ===============================
  // BADGES
  // ===============================
  if (b.verified) {
    console.log("🏅 Verified badge applied");
    document.getElementById("verifiedBadge").innerHTML =
      `<span class="badge badge-verified">Verified</span>`;
  }

  if (b.ownerId) {
    console.log("👑 Claimed badge applied");
    document.getElementById("claimedBadge").innerHTML =
      `<span class="badge badge-claimed">Claimed</span>`;

    const claimedMsg = document.getElementById("claimedMessage");
    if (claimedMsg) {
      claimedMsg.textContent =
        "This business listing has been claimed by the owner.";
    }
  }

  // ===============================
  // OPENING HOURS
  // ===============================
  console.log("⏰ Injecting opening hours...");
  const hoursList = document.getElementById("businessHours");
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

  // ===============================
  // CLAIM BUTTON
  // ===============================
  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) {
    if (b.ownerId) {
      console.log("🔒 Hiding claim button (already claimed)");
      claimBtn.style.display = "none";
    } else {
      claimBtn.href = `/claim-business?b=${b.slug}`;
      console.log("🔗 Claim button link set:", claimBtn.href);
    }
  }

  // ===============================
  // LOAD RELATED BUSINESSES
  // ===============================
  console.log("🔁 Loading related businesses...");
  loadRelated(b.categorySlug, b.townSlug, b.slug);
}

// ===============================
// LOAD RELATED BUSINESSES
// ===============================
async function loadRelated(categorySlug, townSlug, currentSlug) {
  console.log("🔍 Loading related businesses for:", { categorySlug, townSlug, currentSlug });

  const relatedGrid = document.getElementById("relatedGrid");
  relatedGrid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  // 1. Same category + same town
  const q1 = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug);

  const snap1 = await q1.get();
  console.log("📡 Related (same town) results:", snap1.size);

  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

  // 2. If fewer than 4, add same category anywhere
  if (results.length < 4) {
    console.log("📉 Less than 4 results, loading more from same category...");
    const q2 = db.collection("businesses")
      .where("categorySlug", "==", categorySlug);

    const snap2 = await q2.get();
    console.log("📡 Related (same category) results:", snap2.size);

    snap2.forEach(doc => {
      const b = doc.data();
      if (b.slug !== currentSlug && !results.some(r => r.slug === b.slug)) {
        results.push(b);
      }
    });
  }

  results = results.slice(0, 4);
  console.log("🎯 Final related businesses:", results);

  if (results.length === 0) {
    relatedGrid.innerHTML = `<p>No similar businesses found.</p>`;
    return;
  }

  relatedGrid.innerHTML = "";

  results.forEach(b => {
    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}.html`;
    card.className = "related-card";

    card.innerHTML = `
      <h3>${b.name}</h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
    `;

    relatedGrid.appendChild(card);
  });
}
