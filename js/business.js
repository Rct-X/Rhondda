// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

// ===============================
// READ URL PATH PARAMETERS
// ===============================
function getPathParams() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return {
    category: parts[1],
    town: parts[2],
    slug: parts[3]
  };
}

// ===============================
// INIT FIREBASE + LOAD BUSINESS
// ===============================
(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  db = firebase.firestore();

  const page = getPathParams();

  if (!page.category || !page.town || !page.slug) {
    console.error("Missing URL parameters");
    return;
  }

  loadBusiness(page.category, page.town, page.slug);
})();

// ===============================
// LOAD BUSINESS DATA
// ===============================
async function loadBusiness(categorySlug, townSlug, slug) {
  const q = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("slug", "==", slug);

  const snap = await q.get();

  if (snap.empty) {
    document.getElementById("businessName").textContent = "Business Not Found";
    return;
  }

  const b = snap.docs[0].data();

  // SEO
  document.title = `${b.name} | ${b.town} ${b.category} | RCTX Directory`;
  document.getElementById("seoDescription")?.setAttribute(
    "content",
    `${b.name} in ${b.town}. Local ${b.category} serving Rhondda Cynon Taf.`
  );

// ===============================
// STATIC CATEGORY OG IMAGE
// ===============================
const ogImageMap = {
  plumbers: "https://rctx.co.uk/og/plumbers.jpg",
  electricians: "https://rctx.co.uk/og/electricians.jpg",
  builders: "https://rctx.co.uk/og/builders.jpg",
  roofers: "https://rctx.co.uk/og/roofers.jpg",
  "painters-decorators": "https://rctx.co.uk/og/painters-decorators.jpg",
  handyman: "https://rctx.co.uk/og/handyman.jpg",
  cleaners: "https://rctx.co.uk/og/cleaners.jpg",
  "window-cleaners": "https://rctx.co.uk/og/window-cleaners.jpg",
  gardeners: "https://rctx.co.uk/og/gardeners.jpg",
  "waste-collection": "https://rctx.co.uk/og/waste-collection.jpg",
  "man-with-a-van": "https://rctx.co.uk/og/man-with-a-van.jpg",
  removals: "https://rctx.co.uk/og/removals.jpg",
  "car-mechanics": "https://rctx.co.uk/og/car-mechanics.jpg",
  tyres: "https://rctx.co.uk/og/tyres.jpg",
  barbers: "https://rctx.co.uk/og/barbers.jpg",
  hairdressers: "https://rctx.co.uk/og/hairdressers.jpg",
  "beauty-salons": "https://rctx.co.uk/og/beauty-salons.jpg",
  "dog-groomers": "https://rctx.co.uk/og/dog-groomers.jpg",
  cafes: "https://rctx.co.uk/og/cafes.jpg",
  restaurants: "https://rctx.co.uk/og/restaurants.jpg",
  takeaways: "https://rctx.co.uk/og/takeaways.jpg",
  shops: "https://rctx.co.uk/og/shops.jpg",
  gyms: "https://rctx.co.uk/og/gyms.jpg",
  photographers: "https://rctx.co.uk/og/photographers.jpg"
};

const ogUrl =
  ogImageMap[b.categorySlug] ||
  "https://rctx.co.uk/og/default-business.jpg";

document.getElementById("ogImage")?.setAttribute("content", ogUrl);

document
  .querySelector('meta[property="og:url"]')
  ?.setAttribute("content", window.location.href);

document
  .querySelector('link[rel="canonical"]')
  ?.setAttribute("href", window.location.href);
  
  // MAIN CONTENT
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
    websiteEl.href = b.website.startsWith("http") ? b.website : `https://${b.website}`;
  } else {
    websiteEl.textContent = "Not provided";
    websiteEl.removeAttribute("href");
  }

  // SIDEBAR
  document.getElementById("businessTownSidebar").textContent = b.town;
  document.getElementById("businessCategorySidebar").textContent = b.category;

  // BADGES
  if (b.verified) {
    document.getElementById("verifiedBadge").innerHTML =
      `<span class="badge badge-verified">Verified</span>`;
  }

  if (b.ownerId) {
    document.getElementById("claimedBadge").innerHTML =
      `<span class="badge badge-claimed">Claimed</span>`;
    const claimedMsg = document.getElementById("claimedMessage");
    if (claimedMsg) claimedMsg.textContent = "This business listing has been claimed by the owner.";
  }

  // HOURS
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

  // CLAIM BUTTON
  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) {
    if (b.ownerId) {
      claimBtn.style.display = "none";
    } else {
      claimBtn.href = `/claim-business?b=${b.slug}`;
    }
  }

  // RELATED
  loadRelated(b.categorySlug, b.townSlug, b.slug);
}

// ===============================
// LOAD RELATED BUSINESSES
// ===============================
async function loadRelated(categorySlug, townSlug, currentSlug) {
  const relatedGrid = document.getElementById("relatedGrid");
  relatedGrid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  const q1 = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug);

  const snap1 = await q1.get();
  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

  if (results.length < 4) {
    const q2 = db.collection("businesses")
      .where("categorySlug", "==", categorySlug);

    const snap2 = await q2.get();
    snap2.forEach(doc => {
      const b = doc.data();
      if (b.slug !== currentSlug && !results.some(r => r.slug === b.slug)) {
        results.push(b);
      }
    });
  }

  results = results.slice(0, 4);

  if (results.length === 0) {
    relatedGrid.innerHTML = `<p>No similar businesses found.</p>`;
    return;
  }

  relatedGrid.innerHTML = "";

  results.forEach(b => {
    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
    card.className = "related-card";

    card.innerHTML = `
      <h3>${b.name}</h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
    `;

    relatedGrid.appendChild(card);
  });
        }
