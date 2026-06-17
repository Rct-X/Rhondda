async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

// ===============================
// URL PARAMS / PATH HANDLING
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

  // Query params fallback
  const slugQP = url.searchParams.get("slug");
  if (slugQP) {
    return {
      slug: slugQP.trim().toLowerCase()
    };
  }

  // Path fallback
  return extractFromPath(url.pathname);
}

// ===============================
// PATH EXTRACTOR
// ===============================
function extractFromPath(pathname) {
  const clean = pathname.replace(/\/+/g, "/").replace(/\/$/, "");
  const parts = clean.split("/").filter(Boolean);

  const dirIndex = parts.indexOf("directory");
  if (dirIndex === -1) return null;
  if (parts.length < dirIndex + 4) return null;

  return {
    category: decodeURIComponent(parts[dirIndex + 1]).trim().toLowerCase(),
    town: decodeURIComponent(parts[dirIndex + 2]).trim().toLowerCase(),
    slug: decodeURIComponent(parts[dirIndex + 3])
      .split("?")[0]
      .split("&")[0]
      .trim()
      .toLowerCase()
  };
}

// ===============================
// INIT FIREBASE
// ===============================
(async () => {
  try {
    const config = await loadFirebaseConfig();

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    db = firebase.firestore();

    const page = getBusinessParams();
    if (!page || !page.slug) {
      console.error("Missing business slug");
      return;
    }

    await loadBusiness(page.slug);

  } catch (err) {
    console.error("Init error:", err);
  }
})();

// ===============================
// LOAD BUSINESS (FIXED CORE)
// ===============================
async function loadBusiness(slug) {
  try {
    const q = db
      .collection("businesses")
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

    document.getElementById("businessDescription").textContent =
      b.description || "No description provided.";

    document.getElementById("businessPhone").textContent =
      b.phone || "Not provided";

    document.getElementById("businessAddress").textContent =
      b.address || "Not provided";

    // ===============================
    // WEBSITE
    // ===============================
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
    // PHONE / CTA
    // ===============================
    const phoneBtn = document.getElementById("businessPhoneBtn");
    if (phoneBtn) {
      phoneBtn.href = b.phone ? `tel:${b.phone}` : "#";
    }

    const webBtn = document.getElementById("businessWebsiteBtn");
    if (webBtn) {
      if (!b.website) {
        webBtn.style.display = "none";
      } else {
        webBtn.href = b.website.startsWith("http")
          ? b.website
          : `https://${b.website}`;
      }
    }

    // ===============================
    // BADGES
    // ===============================
    if (b.verified) {
      document.getElementById("verifiedBadge").innerHTML +=
        `<span class="badge badge-verified">Verified</span>`;
    }

    if (b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup") {
      document.getElementById("claimedBadge").innerHTML +=
        `<span class="badge badge-claimed">Claimed</span>`;
    }

    if (b.wasteLicence) {
      document.getElementById("verifiedBadge").innerHTML +=
        `<span class="badge badge-waste">♻️ Licensed Waste Carrier</span>`;
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
    // WHATSAPP SHARE
    // ===============================
    const waBtn = document.getElementById("whatsappShareBtn");
    if (waBtn) {
      const text = encodeURIComponent(
        `Check out this local business on RCTX:\n${window.location.href}`
      );
      waBtn.href = `https://wa.me/?text=${text}`;
    }

  } catch (err) {
    console.error("loadBusiness error:", err);
  }
}

// ===============================
// RELATED BUSINESSES (UNCHANGED BUT SAFE)
// ===============================
async function loadRelated(categorySlug, townSlug, currentSlug) {
  const relatedGrid = document.getElementById("relatedGrid");
  if (!relatedGrid) return;

  relatedGrid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  const q1 = db
    .collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .limit(8);

  const snap1 = await q1.get();

  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

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
        <img src="${thumb}" alt="${b.name}" loading="lazy">
      </div>
      <h3>${b.name}</h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
      <span class="view-link">View Business →</span>
    `;

    relatedGrid.appendChild(card);
  });
}
