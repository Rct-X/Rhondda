async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

// ===============================
// READ URL PATH PARAMETERS
// ===============================
function getBusinessParams() {
  const url = new URL(window.location.href);

  // Facebook wrapped links
  const fbWrapped = url.searchParams.get("u");
  if (fbWrapped) {
    try {
      const real = new URL(decodeURIComponent(fbWrapped));
      return extractFromPath(real.pathname);
    } catch (e) {
      console.error("Facebook wrapped URL parse failed", e);
    }
  }

  // Query params
  const categoryQP = url.searchParams.get("category");
  const townQP = url.searchParams.get("town");
  const slugQP = url.searchParams.get("slug");

  if (categoryQP && townQP && slugQP) {
    return {
      category: categoryQP.trim().toLowerCase(),
      town: townQP.trim().toLowerCase(),
      slug: slugQP.trim().toLowerCase()
    };
  }

  // Normal path
  return extractFromPath(url.pathname);
}

// ===============================
// PATH EXTRACTOR
// ===============================
function extractFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);

  const i = parts.indexOf("directory");
  if (i === -1) return null;

  const category = parts[i + 1];
  const town = parts[i + 2];
  const slug = parts[i + 3];

  if (!category || !town || !slug) return null;

  return {
    category: decodeURIComponent(category).toLowerCase(),
    town: decodeURIComponent(town).toLowerCase(),
    slug: decodeURIComponent(slug).toLowerCase()
  };
}

// ===============================
// INIT FIREBASE + LOAD BUSINESS
// ===============================
(async () => {
  try {
    const config = await loadFirebaseConfig();

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    db = firebase.firestore();

    const page = getBusinessParams();
    if (!page) {
      console.error("Missing business parameters");
      return;
    }

    await loadBusiness(page.category, page.town, page.slug);

  } catch (err) {
    console.error("Init error:", err);
  }
})();

// ===============================
// LOAD BUSINESS DATA
// ===============================
if (!categorySlug || !townSlug || !slug) {
  console.error("Invalid URL params", { categorySlug, townSlug, slug });
  document.getElementById("businessName").textContent = "Invalid Business URL";
  return;
}
async function loadBusiness(categorySlug, townSlug, slug) {
  const q = db
    .collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("slug", "==", slug)
    .limit(1);

  const snap = await q.get();

  if (snap.empty) {
    document.getElementById("businessName").textContent = "Business Not Found";
    return;
  }

  const b = snap.docs[0].data();
  window.currentBusiness = b;

  // ===============================
  // SEO
  // ===============================
  document.title = `${b.name} | ${b.town} ${b.category} | RCTX Directory`;

  document.getElementById("seoDescription")?.setAttribute(
    "content",
    `${b.name} in ${b.town}. Local ${b.category} serving Rhondda Cynon Taf.`
  );

  document.getElementById("canonicalUrl")?.setAttribute(
    "href",
    window.location.href
  );

  document.getElementById("ogUrl")?.setAttribute(
    "content",
    window.location.href
  );

  // ===============================
  // MAIN CONTENT
  // ===============================
  document.getElementById("businessName").textContent = b.name;
  document.getElementById("businessCategory").textContent = b.category;
  document.getElementById("businessTown").textContent = b.town;

  const catInline = document.getElementById("businessCategoryInline");
  if (catInline) catInline.textContent = b.category;

  const townInline = document.getElementById("businessTownInline");
  if (townInline) townInline.textContent = b.town;

  document.querySelector(".business-subtitle")?.classList.add("loaded");

  // ===============================
  // QUICK ACTION BUTTONS
  // ===============================
  const phoneBtn = document.getElementById("businessPhoneBtn");
  if (phoneBtn) phoneBtn.href = b.phone ? `tel:${b.phone}` : "#";

  const webBtn = document.getElementById("businessWebsiteBtn");
  if (webBtn) {
    if (!b.website) {
      webBtn.style.display = "none";
    } else {
      webBtn.style.display = "inline-flex";
      webBtn.href = b.website.startsWith("http")
        ? b.website
        : `https://${b.website}`;
    }
  }

  // ===============================
  // ABOUT + CONTACT
  // ===============================
  document.getElementById("businessDescription").textContent =
    b.description || "No description provided.";

  document.getElementById("businessPhone").textContent =
    b.phone || "Not provided";

  document.getElementById("businessAddress").textContent =
    b.address || "Not provided";

  const websiteEl = document.getElementById("businessWebsite");
  if (b.website) {
    websiteEl.textContent = b.website;
    websiteEl.href = b.website.startsWith("http")
      ? b.website
      : `https://${b.website}`;
  } else {
    websiteEl.textContent = "Not provided";
    websiteEl.removeAttribute("href");
  }

  // ===============================
  // SIDEBAR
  // ===============================
  document.getElementById("businessTownSidebar").textContent = b.town;
  document.getElementById("businessCategorySidebar").textContent = b.category;

  // ===============================
  // LOGO
  // ===============================
  const logoEl = document.getElementById("businessLogo");
  if (logoEl) {
    if (b.logoUrl) {
      logoEl.src = b.logoUrl;
      logoEl.style.display = "block";
    } else {
      logoEl.style.display = "none";
    }
  }

  // ===============================
  // GALLERY
  // ===============================
  const galleryEl = document.getElementById("businessGallery");
  if (galleryEl) {
    galleryEl.innerHTML = "";

    if (b.gallery?.length) {
      b.gallery.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.className = "gallery-img";
        img.loading = "lazy";
        img.decoding = "async";
        galleryEl.appendChild(img);
      });
    } else {
      galleryEl.innerHTML = "<p>No photos added yet.</p>";
    }
  }

  // ===============================
  // GALLERY CAROUSEL
  // ===============================
  const scroller = document.getElementById("galleryScroller");
  const counter = document.getElementById("galleryCounter");

  if (scroller && counter) {
    if (b.gallery?.length) {
      scroller.innerHTML = "";
      b.gallery.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.loading = "lazy";
        img.decoding = "async";
        scroller.appendChild(img);
      });

      let current = 1;
      const total = b.gallery.length;
      counter.textContent = `${current} / ${total}`;

      scroller.addEventListener("scroll", () => {
        const width = scroller.children[0].offsetWidth + 10;
        current = Math.round(scroller.scrollLeft / width) + 1;
        counter.textContent = `${current} / ${total}`;
      });
    } else {
      scroller.innerHTML = "<p>No photos added yet.</p>";
      counter.textContent = "";
    }
  }

  // ===============================
  // BADGES
  // ===============================
  if (b.verified) {
    document.getElementById("verifiedBadge").innerHTML += `
      <span class="badge badge-verified">Verified</span>
    `;
  }

  if (b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup") {
    document.getElementById("claimedBadge").innerHTML += `
      <span class="badge badge-claimed">Claimed</span>
    `;
    document.getElementById("claimedMessage").textContent =
      "This business listing has been claimed by the owner.";
  }

  if (b.wasteLicence) {
    document.getElementById("verifiedBadge").innerHTML += `
      <span class="badge badge-waste">♻️ Licensed Waste Carrier</span>
    `;
  }

  // ===============================
  // HOURS
  // ===============================
  const hoursList = document.getElementById("businessHours");
  if (hoursList) {
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
  }

  // ===============================
  // CLAIM BUTTON
  // ===============================
  const claimBtn = document.getElementById("claimBtn");
if (claimBtn) {
  if (b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup") {
    claimBtn.style.display = "none";
  } else {
    claimBtn.href = `/claim-business?b=${b.slug}`;
  }
}

  // ===============================
  // RELATED BUSINESSES
  // ===============================
  await loadRelated(b.categorySlug, b.townSlug, b.slug);

  // ===============================
  // WHATSAPP SHARE BUTTON
  // ===============================
  const waBtn = document.getElementById("whatsappShareBtn");
  if (waBtn) {
    const text = encodeURIComponent(
      `Check out this local business on RCTX:\n${window.location.href}`
    );
    waBtn.href = `https://wa.me/?text=${text}`;
  }
}

// ===============================
// RELATED BUSINESSES
// ===============================
async function loadRelated(categorySlug, townSlug, currentSlug) {
  const relatedGrid = document.getElementById("relatedGrid");
  if (!relatedGrid) return;

  relatedGrid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  const q1 = db
    .collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .limit(8);

  const snap1 = await q1.get();
  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

  if (results.length < 4) {
    const q2 = db
      .collection("businesses")
      .where("categorySlug", "==", categorySlug)
      .limit(8);

    const snap2 = await q2.get();
    snap2.forEach(doc => {
      const b = doc.data();
      if (b.slug !== currentSlug && !results.some(r => r.slug === b.slug)) {
        results.push(b);
      }
    });
  }

  results = results.slice(0, 4);

  if (!results.length) {
    relatedGrid.innerHTML = `<p>No similar businesses found.</p>`;
    return;
  }

  relatedGrid.innerHTML = "";

  results.forEach(b => {
    const card = document.createElement("a");
    card.href = `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;
    card.className = "related-card";

    const thumb =
      b.logoUrl ||
      (b.gallery && b.gallery[0]) ||
      "/images/fallback-business.webp";

    card.innerHTML = `
      <div class="related-thumb">
        <img src="${thumb}" alt="${b.name}" loading="lazy" decoding="async">
      </div>

      <h3>${b.name}</h3>

      <p class="text-dim">${b.category} • ${b.town}</p>

      <span class="view-link">View Business →</span>
    `;

    relatedGrid.appendChild(card);
  });
}

// ===============================
// SHARE POPUP (IMPROVED)
// ===============================
let autoClose;

setTimeout(() => {
  const popup = document.getElementById("sharePopup");
  if (!popup) return;

  popup.classList.add("show");

  autoClose = setTimeout(() => {
    popup.classList.remove("show");
  }, 5000);

}, 6000);

// ===============================
// SHARE BUTTON
// ===============================
function shareBusiness() {
  const url = window.location.href;
  const title = document.title;

  if (navigator.share) {
    navigator.share({
      title,
      text: "Found this business on RCTX — worth a look!",
      url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }
}

// ===============================
// COPY LINK (optional)
// ===============================
function copyBusinessLink() {
  navigator.clipboard.writeText(window.location.href);
  alert("Link copied!");
}
