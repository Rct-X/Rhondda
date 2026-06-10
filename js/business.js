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
function getBusinessParams() {
  const url = new URL(window.location.href);

  // 🔥 1️⃣ FACEBOOK / INSTAGRAM / MESSENGER WRAPPED LINKS (l.php?u=...)
  const fbWrapped = url.searchParams.get("u");
  if (fbWrapped) {
    const real = new URL(fbWrapped);
    const realParts = real.pathname.split("/").filter(Boolean);

    if (realParts.length >= 4) {
      return {
        category: realParts[1],
        town: realParts[2],
        slug: realParts[3]
      };
    }
  }

  // 🔥 2️⃣ FACEBOOK FBCID WRAPPING (normal URL but with ?fbclid=...)
  // Example:
  // https://rctx.co.uk/directory/.../slug?fbclid=IwAR...
  if (url.searchParams.has("fbclid")) {
    const cleanParts = url.pathname.split("/").filter(Boolean);

    if (cleanParts.length >= 4) {
      return {
        category: cleanParts[1],
        town: cleanParts[2],
        slug: cleanParts[3]
      };
    }
  }

  // 3️⃣ Query params (OG redirect)
  const categoryQP = url.searchParams.get("category");
  const townQP = url.searchParams.get("town");
  const slugQP = url.searchParams.get("slug");

  if (categoryQP && townQP && slugQP) {
    return {
      category: categoryQP,
      town: townQP,
      slug: slugQP
    };
  }

  // 4️⃣ Pretty URL fallback
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length >= 4) {
    return {
      category: parts[1],
      town: parts[2],
      slug: parts[3]
    };
  }

  return null;
}

// ===============================
// INIT FIREBASE + LOAD BUSINESS
// ===============================
(async () => {

  try {

    const config =
      await loadFirebaseConfig();

    // Initialise Firebase only once
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

console.error(
      "Init error:",
      err
    );
  } 

})();

// ===============================
// LOAD BUSINESS DATA
// ===============================
async function loadBusiness(
  categorySlug,
  townSlug,
  slug
) {

  const q = db
    .collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .where("slug", "==", slug)
    .limit(1);

  const snap = await q.get();

  if (snap.empty) {

    document.getElementById("businessName")
      .textContent =
        "Business Not Found";

    return;
  }

  const b = snap.docs[0].data();

  window.currentBusiness = b;


  // ===============================
  // SEO
  // ===============================
  document.title =
    `${b.name} | ${b.town} ${b.category} | RCTX Directory`;

  document.getElementById("seoDescription")
    ?.setAttribute(
      "content",
      `${b.name} in ${b.town}. Local ${b.category} serving Rhondda Cynon Taf.`
    );

  // ===============================
  // MAIN CONTENT
  // ===============================
  document.getElementById("businessName")
    .textContent = b.name;

document.getElementById("businessCategory").textContent = b.category;
document.getElementById("businessTown").textContent = b.town;

const catInline = document.getElementById("businessCategoryInline");
if (catInline) catInline.textContent = b.category;

const townInline = document.getElementById("businessTownInline");
if (townInline) townInline.textContent = b.town;

document.querySelector(".business-subtitle")?.classList.add("loaded");
    
 const phoneBtn = document.getElementById("businessPhoneBtn");
if (phoneBtn) phoneBtn.href = b.phone ? `tel:${b.phone}` : "#";

const webBtn = document.getElementById("businessWebsiteBtn");
if (webBtn) {
  webBtn.href = b.website?.startsWith("http")
    ? b.website
    : `https://${b.website || ""}`;
}


  document.getElementById("businessDescription")
    .textContent =
      b.description ||
      "No description provided.";

  document.getElementById("businessPhone")
    .textContent =
      b.phone ||
      "Not provided";

  document.getElementById("businessAddress")
    .textContent =
      b.address ||
      "Not provided";

  // ===============================
  // WEBSITE LINK
  // ===============================
  const websiteEl =
    document.getElementById("businessWebsite");

  if (b.website) {

    websiteEl.textContent =
      b.website;

    websiteEl.href =
      b.website.startsWith("http")
        ? b.website
        : `https://${b.website}`;

  } else {

    websiteEl.textContent =
      "Not provided";

    websiteEl.removeAttribute("href");
  }

  // ===============================
  // SIDEBAR
  // ===============================
  document.getElementById("businessTownSidebar")
    .textContent = b.town;

  document.getElementById("businessCategorySidebar")
    .textContent = b.category;

  // ===============================
  // LOGO
  // ===============================
  const logoEl =
    document.getElementById("businessLogo");

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
  const galleryEl =
    document.getElementById("businessGallery");

  if (galleryEl) {

    galleryEl.innerHTML = "";

    if (
      b.gallery &&
      b.gallery.length
    ) {

      b.gallery.forEach(url => {

        const img =
          document.createElement("img");

        img.src = url;

        img.className =
          "gallery-img";

        img.loading = "lazy";

        img.decoding = "async";

        galleryEl.appendChild(img);

      });

    } else {

      galleryEl.innerHTML =
        "<p>No photos added yet.</p>";
    }
  }

  // ===============================
  // GALLERY CAROUSEL
  // ===============================
  const scroller =
    document.getElementById("galleryScroller");

  const counter =
    document.getElementById("galleryCounter");

  if (
    scroller &&
    counter
  ) {

    if (
      b.gallery &&
      b.gallery.length
    ) {

      scroller.innerHTML = "";

      b.gallery.forEach(url => {

        const img =
          document.createElement("img");

        img.src = url;

        img.loading = "lazy";

        img.decoding = "async";

        scroller.appendChild(img);

      });

      let current = 1;

      const total =
        b.gallery.length;

      counter.textContent =
        `${current} / ${total}`;

      scroller.addEventListener(
        "scroll",
        () => {

          const scrollLeft =
            scroller.scrollLeft;

          const width =
            scroller.children[0]
              .offsetWidth + 10;

          current =
            Math.round(
              scrollLeft / width
            ) + 1;

          counter.textContent =
            `${current} / ${total}`;
        }
      );

    } else {

      scroller.innerHTML =
        "<p>No photos added yet.</p>";

      counter.textContent = "";
    }
  }

  // ===============================
  // BADGES
  // ===============================
  if (b.verified) {

    document.getElementById("verifiedBadge")
      .innerHTML += `
        <span class="badge badge-verified">
          Verified
        </span>
      `;
  }

  if (b.ownerId) {

    document.getElementById("claimedBadge")
      .innerHTML += `
        <span class="badge badge-claimed">
          Claimed
        </span>
      `;

    document.getElementById("claimedMessage")
      .textContent =
        "This business listing has been claimed by the owner.";
  }

  if (b.wasteLicence) {

    document.getElementById("verifiedBadge")
      .innerHTML += `
        <span class="badge badge-waste">
          ♻️ Licensed Waste Carrier
        </span>
      `;
  }

  // ===============================
  // HOURS
  // ===============================
  const hoursList =
    document.getElementById("businessHours");

  if (hoursList) {

    hoursList.innerHTML = "";

    if (b.hours) {

      Object.entries(b.hours)
        .forEach(([day, hours]) => {

          const li =
            document.createElement("li");

          li.textContent =
            `${day}: ${hours}`;

          hoursList.appendChild(li);
        });

    } else {

      hoursList.innerHTML =
        "<li>No hours provided.</li>";
    }
  }

  // ===============================
  // CLAIM BUTTON
  // ===============================
  const claimBtn =
    document.getElementById("claimBtn");

  if (claimBtn) {

    if (b.ownerId) {

      claimBtn.style.display =
        "none";

    } else {

      claimBtn.href =
        `/claim-business?b=${b.slug}`;
    }
  }

  // ===============================
  // RELATED BUSINESSES
  // ===============================
  await loadRelated(
    b.categorySlug,
    b.townSlug,
    b.slug
  );
}

// ===============================
// RELATED BUSINESSES
// ===============================
async function loadRelated(
  categorySlug,
  townSlug,
  currentSlug
) {

  const relatedGrid =
    document.getElementById("relatedGrid");

  if (!relatedGrid) {
    return;
  }

  relatedGrid.innerHTML =
    `<p class="text-dim">Loading recommendations…</p>`;

  let results = [];

  const q1 = db
    .collection("businesses")
    .where("categorySlug", "==", categorySlug)
    .where("townSlug", "==", townSlug)
    .limit(8);

  const snap1 =
    await q1.get();

  snap1.forEach(doc => {

    const b = doc.data();

    if (
      b.slug !== currentSlug
    ) {

      results.push(b);
    }
  });

  if (results.length < 4) {

    const q2 = db
      .collection("businesses")
      .where("categorySlug", "==", categorySlug)
      .limit(8);

    const snap2 =
      await q2.get();

    snap2.forEach(doc => {

      const b = doc.data();

      if (
        b.slug !== currentSlug &&
        !results.some(
          r => r.slug === b.slug
        )
      ) {

        results.push(b);
      }
    });
  }

  results =
    results.slice(0, 4);

  if (!results.length) {

    relatedGrid.innerHTML =
      `<p>No similar businesses found.</p>`;

    return;
  }

  relatedGrid.innerHTML = "";

  results.forEach(b => {

    const card =
      document.createElement("a");

    card.href =
      `/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`;

    card.className =
      "related-card";

  const thumb =
  b.logoUrl ||
  (b.gallery && b.gallery[0]) ||
  "/images/fallback-business.webp";

card.innerHTML = `
  <div class="related-thumb">
    <img
      src="${thumb}"
      alt="${b.name}"
      loading="lazy"
      decoding="async"
    >
  </div>

  <h3>${b.name}</h3>

  <p class="text-dim">
    ${b.category} • ${b.town}
  </p>

  <span class="view-link">
    View Business →
  </span>
`;

    relatedGrid.appendChild(card);

  });

}

// ===============================
// SHARE POPUP
// ===============================
let autoClose;

setTimeout(() => {

  const popup = document.getElementById("sharePopup");
  if (!popup) return;

  popup.classList.add("show");

  autoClose = setTimeout(() => {
    popup.classList.remove("show");
  }, 4000);

}, 6000);

// ===============================
// SHARE BUTTON
function shareBusiness() {
  const url = window.location.href;  // full correct URL
  const title = document.title;

  if (navigator.share) {
    navigator.share({
      title: title,
      text: "Check out this local business on RCTX:",
      url: url
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  }
}
