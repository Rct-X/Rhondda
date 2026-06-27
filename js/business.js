let db;

async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

function getBusinessParams() {
  const url = new URL(window.location.href);
  const fbWrapped = url.searchParams.get("u");
  if (fbWrapped) {
    try {
      const real = new URL(decodeURIComponent(fbWrapped));
      return extractFromPath(real.pathname);
    } catch {}
  }
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
  return extractFromPath(url.pathname);
}

function extractFromPath(pathname) {
  const parts = pathname.split("/").filter(Boolean);
  const i = parts.indexOf("local");
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

(async () => {
  try {
    const config = await loadFirebaseConfig();
    if (!firebase.apps.length) firebase.initializeApp(config);
    db = firebase.firestore();
    const params = getBusinessParams();
    if (!params) {
      document.getElementById("businessName").textContent = "Invalid Business URL";
      return;
    }
    await loadBusiness(params.category, params.town, params.slug);
  } catch (err) {
    console.error("Init error:", err);
  }
})();

async function loadBusiness(categorySlug, townSlug, slug) {
  const q = db.collection("businesses")
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

  const mapBox = document.getElementById("mapBox") || document.querySelector(".map-section");
  if (mapBox) {
    const loadMap = () => {
      if (typeof initBusinessMap === "function" && b.address) {
        initBusinessMap({ address: b.address, name: b.name, town: b.town });
      }
    };
    if (b.address) loadMap();
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMap();
        observer.disconnect();
      }
    });
    observer.observe(mapBox);
  }

  document.querySelector('meta[property="og:image"]')?.setAttribute(
    "content",
    `https://rctx.co.uk/.netlify/functions/og-image?slug=${slug}`
  );

  document.title = `${b.name} | ${b.town} ${b.category} | RCTX Local Network`;

  setText("businessName", b.name);
  setText("businessCategoryInline", b.category);
  setText("businessTownInline", b.town);

  const phoneBtn = document.getElementById("businessPhoneBtn");
  if (phoneBtn) phoneBtn.href = b.phone ? `tel:${b.phone}` : "#";

  const webBtn = document.getElementById("businessWebsiteBtn");
  if (webBtn) {
    if (!b.website) {
      webBtn.style.display = "none";
    } else {
      webBtn.style.display = "inline-flex";
      webBtn.href = b.website.startsWith("http") ? b.website : `https://${b.website}`;
    }
  }

  setText("businessDescription", b.description || "No description provided.");
  setText("businessPhone", b.phone || "Not provided");
  setText("businessAddress", b.address || "Not provided");

  const websiteEl = document.getElementById("businessWebsite");
  if (b.website) {
    websiteEl.textContent = b.website;
    websiteEl.href = b.website.startsWith("http") ? b.website : `https://${b.website}`;
  } else {
    websiteEl.textContent = "Not provided";
    websiteEl.removeAttribute("href");
  }

  const logoEl = document.getElementById("businessLogo");
  if (logoEl) {
    if (b.logoUrl) {
      logoEl.src = b.logoUrl;
      logoEl.style.display = "block";
    } else {
      logoEl.style.display = "none";
    }
  }

  renderCarousel(b.gallery);
  enableLightbox();

  if (b.verified) appendBadge("verifiedBadge", `<span class="badge badge-verified">Verified</span>`);
  if (b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup") {
    appendBadge("claimedBadge", `<span class="badge badge-claimed">Claimed</span>`);
    setText("claimedMessage", "This business listing has been claimed by the owner.");
  }
  if (b.wasteLicence) {
    appendBadge("verifiedBadge", `<span class="badge badge-waste">♻️ Licensed Waste Carrier</span>`);
  }

  renderHours(b.hours);

  const claimBtn = document.getElementById("claimBtn");
  if (claimBtn) {
    if (b.ownerId || b.ownerEmail || b.ownerStatus === "pending_signup") {
      claimBtn.style.display = "none";
    } else {
      claimBtn.href = `/claim-business?b=${b.slug}`;
    }
  }

  await loadRelated(b.categorySlug, b.townSlug, b.slug);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function appendBadge(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML += html;
}

function renderCarousel(gallery) {
  const scroller = document.getElementById("galleryScroller");
  const counter = document.getElementById("galleryCounter");
  if (!scroller || !counter) return;

  scroller.innerHTML = "";
  if (!gallery?.length) {
    counter.textContent = "";
    return;
  }

  gallery.forEach(url => {
    const img = document.createElement("img");
    img.src = url;
    img.loading = "lazy";
    img.decoding = "async";
    scroller.appendChild(img);
  });

  let current = 1;
  const total = gallery.length;
  counter.textContent = `${current} / ${total}`;

  scroller.addEventListener("scroll", () => {
    const width = scroller.children[0].offsetWidth + 10;
    current = Math.round(scroller.scrollLeft / width) + 1;
    counter.textContent = `${current} / ${total}`;
  });
}

function enableLightbox() {
  const scroller = document.getElementById("galleryScroller");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const closeBtn = document.querySelector(".lightbox-close");

  if (!scroller || !lightbox || !lightboxImg || !closeBtn) return;

  scroller.querySelectorAll("img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", () => lightbox.style.display = "none");
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.style.display = "none";
  });
}

function renderHours(hours) {
  const list = document.getElementById("businessHours");
  if (!list) return;
  list.innerHTML = "";
  if (!hours) {
    list.innerHTML = "<li>No hours provided.</li>";
    return;
  }
  Object.entries(hours).forEach(([day, value]) => {
    const li = document.createElement("li");
    li.textContent = `${day}: ${value}`;
    list.appendChild(li);
  });
}

async function loadRelated(categorySlug, townSlug, currentSlug) {
  const grid = document.getElementById("relatedGrid");
  if (!grid) return;

  grid.innerHTML = `<p class="text-dim">Loading recommendations…</p>`;
  let results = [];

  const q1 = db.collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .limit(8);

  const snap1 = await q1.get();
  snap1.forEach(doc => {
    const b = doc.data();
    if (b.slug !== currentSlug) results.push(b);
  });

  if (results.length < 4) {
    const q2 = db.collection("businesses")
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
    grid.innerHTML = `<p>No similar businesses found.</p>`;
    return;
  }

  grid.innerHTML = "";
  results.forEach(b => {
    const card = document.createElement("a");
    card.href = `/local/${b.categorySlug}/${b.townSlug}/${b.slug}`;
    card.className = "related-card";

    const thumb = b.logoUrl || (b.gallery && b.gallery[0]) || "/images/fallback-business.webp";

    card.innerHTML = `
      <div class="related-thumb">
        <img src="${thumb}" alt="${b.name}" loading="lazy" decoding="async">
      </div>
      <h3>${b.name}</h3>
      <p class="text-dim">${b.category} • ${b.town}</p>
      <span class="view-link">View Business →</span>
    `;

    grid.appendChild(card);
  });
}

function getCleanBusinessUrl() {
  const params = getBusinessParams();
  if (!params) return window.location.href;
  return `https://rctx.co.uk/local/${params.category}/${params.town}/${params.slug}`;
}

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
    showToast("Link copied!");
  }
}

async function copyBusinessLink() {
  const cleanUrl = getCleanBusinessUrl();
  try {
    await navigator.clipboard.writeText(cleanUrl);
    showToast("Link copied!");
  } catch {
    const temp = document.createElement("input");
    temp.value = cleanUrl;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand("copy");
    temp.remove();
    showToast("Link copied!");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
