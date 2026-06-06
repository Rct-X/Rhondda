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

// =====================================
// UNIFIED AUTO-SUGGEST (CATEGORIES + BUSINESSES)
// =====================================

const unifiedBox = document.getElementById("unifiedSuggestions");

// Full category list (exact match to your HTML)
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

// Slugify (same as your add-business.js)
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Listen to typing
searchInput.addEventListener("input", async () => {
  const term = searchInput.value.trim().toLowerCase();
  unifiedBox.innerHTML = "";

  if (!term) {
    unifiedBox.style.display = "none";
    return;
  }

  // ============================
  // CATEGORY MATCHES
  // ============================
  const matchedCategories = categories.filter(c =>
    c.toLowerCase().includes(term)
  );

  // ============================
  // BUSINESS MATCHES (Firestore)
  // ============================
  const businessMatches = [];
  const q = db.collection("businesses").where("keywords", "array-contains", term);
  const snap = await q.get();

  snap.forEach(doc => {
    const b = doc.data();
    businessMatches.push(b);
  });

  // If nothing found
  if (matchedCategories.length === 0 && businessMatches.length === 0) {
    unifiedBox.style.display = "none";
    return;
  }

  // ============================
  // BUILD SUGGESTION LIST
  // SMART MIXED ORDERING
  // ============================

  // Mix categories + businesses in alternating order
  const maxLen = Math.max(matchedCategories.length, businessMatches.length);

  for (let i = 0; i < maxLen; i++) {
    if (matchedCategories[i]) {
      const cat = matchedCategories[i];
      const div = document.createElement("div");
      div.className = "unified-suggestion-item unified-suggestion-category";
      div.textContent = cat;

      div.addEventListener("click", () => {
        window.location.href = `/directory/${slugify(cat)}`;
      });

      unifiedBox.appendChild(div);
    }

    if (businessMatches[i]) {
      const b = businessMatches[i];
      const div = document.createElement("div");
      div.className = "unified-suggestion-item unified-suggestion-business";
      div.textContent = `${b.name} — ${b.town}`;

      div.addEventListener("click", () => {
        window.location.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
      });

      unifiedBox.appendChild(div);
    }
  }

  unifiedBox.style.display = "block";
});

// Hide suggestions when clicking outside
document.addEventListener("click", e => {
  if (!e.target.closest(".directory-search")) {
    unifiedBox.style.display = "none";
  }
});



