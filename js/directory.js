// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  console.log("🔥 [directory.js] Fetching Firebase config...");
  const res = await fetch("/.netlify/functions/firebaseConfig");
  const json = await res.json();
  console.log("🔥 [directory.js] Firebase config loaded:", json);
  return json;
}

let db;

// ===============================
// INIT FIREBASE + ROUTING
// ===============================
(async () => {
  console.log("🚀 [directory.js] Initialising Firebase...");
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  db = firebase.firestore();
  console.log("🔥 [directory.js] Firestore initialised:", db);

  const page = detectPageType();
  console.log("📌 [directory.js] detectPageType() returned:", page);

  if (page.type === "category") {
    console.log("📥 [directory.js] Loading CATEGORY:", page.category);
    loadCategory(page.category);
  }

  if (page.type === "categoryTown") {
    console.log("📥 [directory.js] Loading CATEGORY + TOWN:", page);
    loadCategoryTown(page.category, page.town);
  }

  if (page.type === "business") {
    console.warn("⚠️ [directory.js] Business page detected — business.js should handle this.");
  }

  if (page.type === "home") {
    console.log("🏠 [directory.js] Directory homepage detected.");
  }
})();

// ===============================
// DOM ELEMENTS
// ===============================
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsGrid = document.getElementById("resultsGrid");

// ===============================
// URL PARSER
// ===============================
function detectPageType() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  console.log("🔍 [directory.js] URL parts:", parts);

  if (parts.length === 2 && parts[0] === "directory") {
    console.log("📌 [directory.js] Category page detected");
    return { type: "category", category: parts[1] };
  }

  if (parts.length === 3 && parts[0] === "directory") {
    console.log("📌 [directory.js] Category + Town page detected");
    return { type: "categoryTown", category: parts[1], town: parts[2] };
  }

  if (parts.length === 4 && parts[0] === "directory") {
    console.log("📌 [directory.js] Business page detected");
    return { type: "business", category: parts[1], town: parts[2], slug: parts[3] };
  }

  console.log("📌 [directory.js] Home page detected");
  return { type: "home" };
}

// ===============================
// LOAD CATEGORY
// ===============================
async function loadCategory(categorySlug) {
  console.log("📡 [directory.js] Querying Firestore for category:", categorySlug);

  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug}…</p>`;

  const q = db.collection("businesses")
              .where("categorySlug", "==", categorySlug);

  const snap = await q.get();
  console.log("📡 [directory.js] Firestore category results:", snap.size);

  if (snap.empty) {
    console.warn("❌ [directory.js] No businesses found for category:", categorySlug);
    resultsGrid.innerHTML = `<p>No businesses found in this category.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();
    console.log("🧱 [directory.js] Building card for:", b);

    const link = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}.html`;
    console.log("🔗 [directory.js] Business link generated:", link);

    const card = document.createElement("a");
    card.href = link;
    card.className = "card-business";

    card.innerHTML = `
      <h3>${b.name}
        ${b.verified ? `<span class="badge badge-verified">Verified</span>` : ""}
        ${b.ownerId ? `<span class="badge badge-claimed">Claimed</span>` : ""}
      </h3>
      <p class="text-dim">${b.town}</p>
    `;

    resultsGrid.appendChild(card);
  });
}

// ===============================
// LOAD CATEGORY + TOWN
// ===============================
async function loadCategoryTown(categorySlug, townSlug) {
  console.log("📡 [directory.js] Querying Firestore for:", { categorySlug, townSlug });

  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug} in ${townSlug}…</p>`;

  const q = db.collection("businesses")
              .where("categorySlug", "==", categorySlug)
              .where("townSlug", "==", townSlug);

  const snap = await q.get();
  console.log("📡 [directory.js] Firestore category+town results:", snap.size);

  if (snap.empty) {
    console.warn("❌ [directory.js] No businesses found in:", { categorySlug, townSlug });
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();
    console.log("🧱 [directory.js] Building card for:", b);

    const link = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}.html`;
    console.log("🔗 [directory.js] Business link generated:", link);

    const card = document.createElement("a");
    card.href = link;
    card.className = "card-business";

    card.innerHTML = `
      <h3>${b.name}
        ${b.verified ? `<span class="badge badge-verified">Verified</span>` : ""}
        ${b.ownerId ? `<span class="badge badge-claimed">Claimed</span>` : ""}
      </h3>
      <p class="text-dim">${b.town}</p>
    `;

    resultsGrid.appendChild(card);
  });
}

// ===============================
// SEARCH HANDLER
// ===============================
async function searchDirectory() {
  const term = searchInput.value.trim().toLowerCase();
  console.log("🔍 [directory.js] Search term:", term);

  if (!term) {
    console.warn("⚠️ [directory.js] Empty search term");
    return;
  }

  resultsGrid.innerHTML = `<p class="text-dim">Searching…</p>`;

  const q = db.collection("businesses")
              .where("keywords", "array-contains", term);

  const snap = await q.get();
  console.log("📡 [directory.js] Search results:", snap.size);

  if (snap.empty) {
    console.warn("❌ [directory.js] No search results for:", term);
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();
    console.log("🧱 [directory.js] Building search result card for:", b);

    const link = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}.html`;
    console.log("🔗 [directory.js] Search result link:", link);

    const card = document.createElement("a");
    card.href = link;
    card.className = "card-business";

    card.innerHTML = `
      <h3>${b.name}
        ${b.verified ? `<span class="badge badge-verified">Verified</span>` : ""}
        ${b.ownerId ? `<span class="badge badge-claimed">Claimed</span>` : ""}
      </h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
    `;

    resultsGrid.appendChild(card);
  });
}

// ===============================
// EVENTS
// ===============================
if (searchBtn) {
  console.log("🖱️ [directory.js] Search button active");
  searchBtn.addEventListener("click", searchDirectory);
}

if (searchInput) {
  console.log("⌨️ [directory.js] Search input active");
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") searchDirectory();
  });
}
