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

  if (parts.length === 2 && parts[0] === "directory") {
    return { type: "category", category: parts[1] };
  }

  if (parts.length === 3 && parts[0] === "directory") {
    return { type: "categoryTown", category: parts[1], town: parts[2] };
  }

  return { type: "home" };
}

// ===============================
// CARD RENDERER
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
// LOAD CATEGORY
// ===============================
async function loadCategory(categorySlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .get();

  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>Showing <strong>${snap.size}</strong> businesses in <strong>${categorySlug}</strong></p>
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
// LOAD CATEGORY + TOWN
// ===============================
async function loadCategoryTown(categorySlug, townSlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug} in ${townSlug}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .get();

  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>Showing <strong>${snap.size}</strong> businesses in <strong>${categorySlug} • ${townSlug}</strong></p>
    `;
  }

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";
  snap.forEach(doc => resultsGrid.appendChild(renderBusinessCard(doc.data())));
}

// ===============================
// SEARCH
// ===============================
async function searchDirectory() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return;

  resultsGrid.innerHTML = `<p class="text-dim">Searching…</p>`;

  const snap = await db.collection("businesses")
    .where("keywords", "array-contains", term)
    .get();

  if (resultsMeta) {
    const suggestions = `
      <div style="margin-top:8px;font-size:0.9rem;">
        Suggested:
        <a href="/directory/plumbers">Plumbers</a> •
        <a href="/directory/electricians">Electricians</a> •
        <a href="/directory/builders">Builders</a> •
        <a href="/directory/cleaners">Cleaners</a> •
        <a href="/directory/roofers">Roofers</a>
      </div>
    `;

    resultsMeta.innerHTML = `
      <p>
        Showing <strong>${snap.size}</strong> results for <strong>${term}</strong>
      </p>
      ${suggestions}
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
// ROTATING PLACEHOLDER (HYBRID UX)
// ===============================
const placeholders = [
  "Search electricians in Pontypridd...",
  "Search plumbers in Tonypandy...",
  "Search builders in Treorchy...",
  "Search cleaners near you...",
  "Search barbers in Porth...",
  "Search any local service..."
];

let i = 0;

setInterval(() => {
  if (!searchInput) return;
  searchInput.placeholder = placeholders[i];
  i = (i + 1) % placeholders.length;
}, 2500);
