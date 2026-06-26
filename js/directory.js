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

// Helper utility to turn hyphens into readable, clean capital text strings
function cleanString(str) {
  if (!str) return "";
  return str
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ===============================
// BUSINESS CARD COMPONENT
// ===============================
function renderBusinessCard(b) {
  const card = document.createElement("a");
  card.href = `/local/${b.categorySlug}/${b.townSlug}/${b.slug}`;
  card.className = "card-business";

  card.innerHTML = `
    <div class="card-header">
      <h3>
        ${b.name}
        ${b.verified ? '<span class="badge badge-verified">Verified</span>' : ""}
        ${(b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup")
          ? '<span class="badge badge-claimed">Claimed</span>'
          : ""}
      </h3>
    </div>

    <p class="card-description">
      ${b.description || `Professional ${b.category} services.`}
    </p>

    <div class="card-info">
      <p>📍 ${b.town}</p>
      <p>🛠 ${b.services || b.category}</p>
    </div>

    <span class="view-business">
      View Business →
    </span>
  `;

  return card;
}

// ===============================
// LOAD CATEGORY (RANDOMISED)
// ===============================
async function loadCategory(categorySlug) {
  resultsGrid.innerHTML = `<p class="text-dim">Loading ${cleanString(categorySlug)}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("status", "==", "approved")
    .get();

  const humanCategory = cleanString(categorySlug);
  
  // Dynamic SEO Injection (Updates browser tab strings instantly)
  document.title = `${humanCategory} in Rhondda Cynon Taf | RCTX Local`;

  resultsMeta.innerHTML = `
    <p>Showing <strong>${snap.size}</strong> businesses in <strong>${humanCategory}</strong></p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
}

// ===============================
// LOAD CATEGORY + TOWN (RANDOMISED)
// ===============================
async function loadCategoryTown(categorySlug, townSlug) {
  const humanCategory = cleanString(categorySlug);
  const humanTown = cleanString(townSlug);

  resultsGrid.innerHTML = `<p class="text-dim">Loading ${humanCategory} in ${humanTown}…</p>`;

  const snap = await db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("status", "==", "approved")
    .get();

  // Dynamic SEO Injection
  document.title = `${humanCategory} in ${humanTown} | RCTX Local`;

  resultsMeta.innerHTML = `
    <p>Showing <strong>${snap.size}</strong> businesses in <strong>${humanCategory} • ${humanTown}</strong></p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
}

// ===============================
// SEARCH NETWORK ACTION
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
    <p>Showing <strong>${snap.size}</strong> results for "<strong>${term}</strong>"</p>
  `;

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found matching that term.</p>`;
    return;
  }

  let results = [];
  snap.forEach(doc => results.push(doc.data()));
  results.sort(() => Math.random() - 0.5);

  resultsGrid.innerHTML = "";
  results.forEach(b => resultsGrid.appendChild(renderBusinessCard(b)));
  
  // Smoothly scrolls user frame downwards into results view panel once search finishes
  resultsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===============================
// GLOBAL EVENT LISTENERS
// ===============================
searchBtn.addEventListener("click", searchLocal);

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchLocal();
});

// ===============================
// ROTATING TIMED PLACEHOLDERS
// ===============================
const placeholders = [
  "Find waste collectors in Treorchy...",
  "Find electricians in Pontypridd...",
  "Search shops in Tonypandy...",
  "Find cleaners in Ferndale...",
  "Search plumbers in Aberdare..."
];

let placeholderIndex = 0;

setInterval(() => {
  searchInput.placeholder = placeholders[placeholderIndex];
  placeholderIndex = (placeholderIndex + 1) % placeholders.length;
}, 3000); // Shifted slightly to 3s for perfect human pacing reading times
