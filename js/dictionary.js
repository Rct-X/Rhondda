// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

// ===============================
// INIT FIREBASE + ROUTING
// ===============================
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

  // Business page handled in business.js
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
  // ["directory", "barbers", "treorchy"]

  // /directory/barbers
  if (parts.length === 2 && parts[0] === "directory") {
    return { type: "category", category: parts[1] };
  }

  // /directory/barbers/treorchy
  if (parts.length === 3 && parts[0] === "directory") {
    return { type: "categoryTown", category: parts[1], town: parts[2] };
  }

  // /directory/barbers/treorchy/fade-room
  if (parts.length === 4 && parts[0] === "directory") {
    return { type: "business", category: parts[1], town: parts[2], slug: parts[3] };
  }

  return { type: "home" };
}

// ===============================
// LOAD CATEGORY
// ===============================
async function loadCategory(categorySlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug}…</p>`;

  const q = db.collection("businesses")
              .where("categorySlug", "==", categorySlug);

  const snap = await q.get();

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this category.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();

    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
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
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${categorySlug} in ${townSlug}…</p>`;

  const q = db.collection("businesses")
              .where("categorySlug", "==", categorySlug)
              .where("townSlug", "==", townSlug);

  const snap = await q.get();

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();

    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
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
  if (!term) return;

  resultsGrid.innerHTML = `<p class="text-dim">Searching…</p>`;

  const q = db.collection("businesses")
              .where("keywords", "array-contains", term);

  const snap = await q.get();

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();

    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
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
if (searchBtn) searchBtn.addEventListener("click", searchDirectory);
if (searchInput) searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchDirectory();
});
