// ===============================
// DOM ELEMENTS
// ===============================
const resultsGrid = document.getElementById("resultsGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsMeta = document.getElementById("resultsMeta");

let db;
window.searchAliases = {}; // category + alias map

// ===============================
// FIREBASE INIT
// ===============================
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  db = firebase.firestore();

  // load category aliases once
  try {
    const aliasRes = await fetch("/.netlify/functions/getCategoryAliases");
    const categoryAliases = await aliasRes.json();

    Object.entries(categoryAliases).forEach(([category, aliases]) => {
      const slug = category.toLowerCase();

      window.searchAliases[category.toLowerCase()] = slug;

      aliases.forEach(a => {
        window.searchAliases[a.toLowerCase()] = slug;
      });
    });

  } catch (err) {
    console.error("Alias load failed", err);
  }

  const page = detectPageType();

  if (page.type === "category") {
    loadCategory(page.category);
  }

  if (page.type === "categoryTown") {
    loadCategoryTown(page.category, page.town);
  }
})();

// ===============================
// ROUTER
// ===============================
function detectPageType() {
  const parts = window.location.pathname.split("/").filter(Boolean);

  if (parts.length === 2 && parts[0] === "directory") {
    return { type: "category", category: parts[1] };
  }

  if (parts.length === 3 && parts[0] === "directory") {
    return { type: "categoryTown", category: parts[1], town: parts[2] };
  }

  return { type: "home" };
}

// ===============================
// RENDER CARD
// ===============================
function renderBusinessCard(b) {
  const card = document.createElement("a");

  card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
  card.className = "card-business";

  card.innerHTML = `
    <h3>
      ${b.name}
      ${b.verified ? `<span class="badge badge-verified">Verified</span>` : ""}
      ${b.ownerId ? `<span class="badge badge-claimed">Claimed</span>` : ""}
    </h3>
    <p class="text-dim">${b.category} • ${b.town}</p>
  `;

  return card;
}

// ===============================
// LOAD CATEGORY (APPROVED ONLY)
// ===============================
async function loadCategory(categorySlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("status", "==", "approved")
    .get();

  renderResults(snap, `${categorySlug}`);
}

// ===============================
// LOAD CATEGORY + TOWN
// ===============================
async function loadCategoryTown(categorySlug, townSlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug} in ${townSlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("status", "==", "approved")
    .get();

  renderResults(snap, `${categorySlug} • ${townSlug}`);
}

// ===============================
// SEARCH (with alias + approved filter)
// ===============================
async function searchDirectory() {
  const raw = searchInput.value.trim().toLowerCase();
  if (!raw) return;

  const mappedCategory = window.searchAliases[raw] || null;

  resultsGrid.innerHTML = `<p class="text-dim">Searching…</p>`;

  let query = db.collection("businesses")
    .where("status", "==", "approved");

  // If user typed category/alias → filter category
  if (mappedCategory) {
    query = query.where("categorySlug", "==", mappedCategory);
  }

  // If not category → keyword search
  const snap = mappedCategory
    ? await query.get()
    : await db.collection("businesses")
        .where("keywords", "array-contains", raw)
        .where("status", "==", "approved")
        .get();

  renderResults(snap, raw);
}

// ===============================
// RENDER SHARED
// ===============================
function renderResults(snap, label) {
  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>Showing <strong>${snap.size}</strong> results for <strong>${label}</strong></p>
    `;
  }

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";
  snap.forEach(doc => resultsGrid.appendChild(renderBusinessCard(doc.data())));
}

// ===============================
// EVENTS
// ===============================
if (searchBtn) {
  searchBtn.addEventListener("click", searchDirectory);
}

if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") searchDirectory();
  });
}

// ===============================
// PLACEHOLDER ROTATION
// ===============================
const placeholders = [
  "Find electricians in Pontypridd...",
  "Find plumbers in Tonypandy...",
  "Find builders in Treorchy..."
];

let i = 0;

setInterval(() => {
  if (!searchInput) return;
  searchInput.placeholder = placeholders[i];
  i = (i + 1) % placeholders.length;
}, 2500);
