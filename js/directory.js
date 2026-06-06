// ===============================
// DOM ELEMENTS
// ===============================
const resultsGrid = document.getElementById("resultsGrid");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const resultsMeta = document.getElementById("resultsMeta");
const unifiedBox = document.getElementById("unifiedSuggestions");

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
// CATEGORY LOAD
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
// CATEGORY + TOWN
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
    resultsGrid.innerHTML = `<p>No businesses found.</p>`;
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
    resultsMeta.innerHTML = `
      <p>Showing <strong>${snap.size}</strong> results for <strong>${term}</strong></p>
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
if (searchBtn) searchBtn.addEventListener("click", searchDirectory);

if (searchInput) {
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") searchDirectory();
  });
}

// ===============================
// UNIFIED AUTOSUGGEST
// ===============================
const categories = [
  "Accountants","Aerial Installers","Air Conditioning Services","Architects","Auto Electricians",
  "Bakers","Barbers","Bathroom Fitters","Beauty Salons","Bedroom Fitters","Bike Repairs",
  "Blinds & Shutters","Boiler Installers","Bricklayers","Builders","Building Supplies","Butchers",
  "Cafes","Car Body Repairs","Car Dealers","Car Detailing","Car Hire","Car Mechanics","Car Valeting",
  "Carpenters","Carpet Cleaners","Carpet Fitters","Caterers","Childcare Services","Chimney Sweeps",
  "Cleaners","Computer Repairs","Conservatory Installers","Courier Services","Decorators","Dentists",
  "Dog Groomers","Double Glazing","Drainage Services","Driving Schools","Electricians","Estate Agents",
  "Fencing Contractors","Financial Advisors","Firewood Suppliers","Flooring Services","Florists",
  "Funeral Directors","Garage Doors","Garden Centres","Gardeners","Gas Engineers","Graphic Designers",
  "Greengrocers","Gutter Cleaning","Gyms","Hairdressers","Handyman Services","Heating Engineers",
  "Home Care Services","House Clearances","Insurance Brokers","Interior Designers","Joiners",
  "Kitchen Fitters","Landscapers","Laundry Services","Locksmiths","Man With A Van","Martial Arts Clubs",
  "Massage Therapists","Mobile Phone Repairs","Mortgage Advisors","Nail Salons","Osteopaths",
  "Painters & Decorators","Party Supplies","Paving Contractors","Personal Trainers","Pest Control",
  "Pet Shops","Photographers","Physiotherapists","Pizza Shops","Plasterers","Plumbers",
  "Pressure Washing","Printers","Removals","Restaurants","Roof Cleaners","Roofers","Scaffolding",
  "Security Services","Shops","Skip Hire","Solar Panel Installers","Solicitors","Sports Clubs",
  "Storage Services","Takeaways","Tattoo Studios","Taxi Services","Tilers","Travel Agents",
  "Tree Surgeons","Tyres & Repairs","Upholstery Cleaning","Vets","Waste Collection","Wedding Services",
  "Window Cleaners","Window Fitters","Yoga Classes"
];

function slugify(str) {
  return str.toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function debounce(fn, delay = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

searchInput.addEventListener("input", debounce(async () => {
  const term = searchInput.value.trim().toLowerCase();

  if (!term) {
    unifiedBox.style.display = "none";
    return;
  }

  unifiedBox.innerHTML = "";

  const matchedCategories = categories.filter(c =>
    c.toLowerCase().includes(term)
  );

  const snap = await db.collection("businesses")
    .where("keywords", "array-contains", term)
    .get();

  const businessMatches = [];
  snap.forEach(doc => businessMatches.push(doc.data()));

  if (!matchedCategories.length && !businessMatches.length) {
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
}, 200));

// ===============================
// CLOSE ON OUTSIDE CLICK
// ===============================
document.addEventListener("click", e => {
  if (!e.target.closest(".directory-search")) {
    unifiedBox.style.display = "none";
  }
});
