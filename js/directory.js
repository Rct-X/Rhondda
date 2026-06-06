// ===============================
// DOM ELEMENTS
// ===============================
const resultsGrid = document.getElementById("resultsGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsMeta = document.getElementById("resultsMeta");

const unifiedBox = document.getElementById("unifiedSuggestions");

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
})();

// ===============================
// URL PARSER
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
// BUSINESS CARD RENDERER (CLEANED)
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

  const q = db.collection("businesses")
              .where("categorySlug", "==", categorySlug);

  const snap = await q.get();

  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>
        Showing <strong>${snap.size}</strong> businesses in 
        <strong>${categorySlug}</strong>
      </p>
    `;
  }

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this category.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    resultsGrid.appendChild(renderBusinessCard(doc.data()));
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

  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>
        Showing <strong>${snap.size}</strong> businesses in 
        <strong>${categorySlug} • ${townSlug}</strong>
      </p>
    `;
  }

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found in this area.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    resultsGrid.appendChild(renderBusinessCard(doc.data()));
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

  if (resultsMeta) {
    resultsMeta.innerHTML = `
      <p>
        Showing <strong>${snap.size}</strong> search results for 
        <strong>${term}</strong>
      </p>
    `;
  }

  if (snap.empty) {
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
    return;
  }

  resultsGrid.innerHTML = "";

  snap.forEach(doc => {
    resultsGrid.appendChild(renderBusinessCard(doc.data()));
  });
}

// ===============================
// DEBOUNCE (IMPORTANT PERFORMANCE FIX)
// ===============================
function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ===============================
// SEARCH EVENTS
// ===============================
if (searchBtn) searchBtn.addEventListener("click", searchDirectory);

if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") searchDirectory();
  });
}

// ===============================
// UNIFIED AUTO-SUGGEST (DEBOUNCED)
// ===============================
const categories = [/* unchanged list */];

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

searchInput.addEventListener("input", debounce(async () => {
  const term = searchInput.value.trim().toLowerCase();

  unifiedBox.innerHTML = "";

  if (term.length < 2) {
    unifiedBox.style.display = "none";
    return;
  }

  const matchedCategories = categories.filter(c =>
    c.toLowerCase().includes(term)
  );

  const q = db.collection("businesses")
              .where("keywords", "array-contains", term);

  const snap = await q.get();

  const businessMatches = [];
  snap.forEach(doc => businessMatches.push(doc.data()));

  if (matchedCategories.length === 0 && businessMatches.length === 0) {
    unifiedBox.style.display = "none";
    return;
  }

  const maxLen = Math.max(matchedCategories.length, businessMatches.length);

  for (let i = 0; i < maxLen; i++) {

    if (matchedCategories[i]) {
      const div = document.createElement("div");
      div.className = "unified-suggestion-item unified-suggestion-category";
      div.textContent = matchedCategories[i];

      div.onclick = () => {
        window.location.href = `/directory/${slugify(matchedCategories[i])}`;
      };

      unifiedBox.appendChild(div);
    }

    if (businessMatches[i]) {
      const b = businessMatches[i];
      const div = document.createElement("div");
      div.className = "unified-suggestion-item unified-suggestion-business";
      div.textContent = `${b.name} — ${b.town}`;

      div.onclick = () => {
        window.location.href =
          `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
      };

      unifiedBox.appendChild(div);
    }
  }

  unifiedBox.style.display = "block";
}, 250));

// ===============================
// OUTSIDE CLICK CLOSE
// ===============================
document.addEventListener("click", e => {
  if (!e.target.closest(".directory-search")) {
    unifiedBox.style.display = "none";
  }
});
