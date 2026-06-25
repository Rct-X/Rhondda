// ======================================
// DIRECTORY PAGE SCRIPT (NO SUGGESTIONS)
// ======================================

// ===============================
// DOM ELEMENTS
// ===============================
const resultsGrid = document.getElementById("resultsGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsMeta = document.getElementById("resultsMeta");

let db;

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

  if (parts.length === 2 && parts[0] === "local") {
    return { type: "category", category: parts[1] };
  }

  if (parts.length === 3 && parts[0] === "local") {
    return { type: "categoryTown", category: parts[1], town: parts[2] };
  }

  return { type: "home" };
}

// ===============================
// BUSINESS CARD
// ===============================
function renderBusinessCard(b) {
  const card = document.createElement("a");
  card.href = `/local/${b.categorySlug}/${b.townSlug}/${b.slug}`;
  card.className = "card-business";

  card.innerHTML = `
    <h3>
      ${b.name}
      ${b.verified ? `<span class="badge badge-verified">Verified</span>` : ""}
      ${(b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup")
        ? `<span class="badge badge-claimed">Claimed</span>`
        : ""}
    </h3>
    <p class="text-dim">${b.category} • ${b.town}</p>
  `;

  return card;
}

// ===============================
// LOAD CATEGORY (RANDOMISED)
// ===============================
async function loadCategory(categorySlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("status", "==", "approved")
    .get();

  resultsMeta.innerHTML = `
    <p>Showing <strong>${snap.size}</strong> businesses in <strong>${categorySlug}</strong></p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  // Convert to array + shuffle
  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  // Render
  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
}

// ===============================
// LOAD CATEGORY + TOWN (RANDOMISED)
// ===============================
async function loadCategoryTown(categorySlug, townSlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug} in ${townSlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("status", "==", "approved")
    .get();

  resultsMeta.innerHTML = `
    <p>Showing <strong>${snap.size}</strong> businesses in <strong>${categorySlug} • ${townSlug}</strong></p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  // Convert to array + shuffle
  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  // Render
  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
}

// ===============================
// SEARCH DIRECTORY (RANDOMISED)
// ===============================
async function searchLocal() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return;

  resultsGrid.innerHTML = `<p class="text-dim">Searching…</p>`;

  const snap = await db.collection("businesses")
    .where("keywords", "array-contains", term)
    .where("status", "==", "approved")
    .get();

  resultsMeta.innerHTML = `
    <p>Showing <strong>${snap.size}</strong> results for <strong>${term}</strong></p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  // Convert to array + shuffle
  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  // Render
  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
}

// ===============================
// EVENTS
// ===============================
searchBtn.addEventListener("click", searchLocal);

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchLocal();
});

// ===============================
// ROTATING PLACEHOLDER
// ===============================
const placeholders = [
  "Find electricians in Pontypridd...",
  "Find plumbers in Tonypandy...",
  "Search shops in Treorchy...",
  "Find cleaners in Ferndale..."
];

let i = 0;

setInterval(() => {
  searchInput.placeholder = placeholders[i];
  i = (i + 1) % placeholders.length;
}, 2500);
