// ===============================
// FETCH FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ===============================
// GET URL PARAMS (CLEAN)
// ===============================
function getPathParams() {
  const parts = window.location.pathname
    .split("/")
    .filter(Boolean);

  // Expect: /directory/category/town/slug
  if (parts.length !== 4 || parts[0] !== "directory") {
    return null;
  }

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
  try {
    const config = await loadFirebaseConfig();

if (!window.firebase) {
  throw new Error("Firebase SDK not loaded");
}

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

if (!firebase.firestore) {
  throw new Error("Firestore not loaded");
}

db = firebase.firestore();

    const page = getPathParams();

    if (!page) {
      console.error("Invalid URL structure");
      return;
    }

    await loadBusiness(
      page.category,
      page.town,
      page.slug
    );

  } catch (err) {
    console.error("Init error:", err);
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
  setText("businessName", b.name);

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
  const badges = [];

// VERIFIED
if (b.verified) {
  badges.push(`<span class="badge badge-verified">Verified</span>`);
}

// CLAIMED
if (b.ownerId) {
  badges.push(`<span class="badge badge-claimed">Claimed</span>`);
  setText("claimedMessage", "This business listing has been claimed by the owner.");
}

// WASTE LICENCE
if (b.wasteLicence) {
  badges.push(`<span class="badge badge-waste">♻️ Licensed Waste Carrier</span>`);
}

// APPLY ONCE (clean DOM)
setHTML("verifiedBadge", badges.join(" "));

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

      if (!results.some(r => r.slug === b.slug)) {
  results.push(b);
}
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

  card.innerHTML = `
  <div class="related-thumb"></div>
  <h3>${b.name}</h3>
  <p class="text-dim">${b.category} • ${b.town}</p>
  <span class="view-link">View Business →</span>
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

// if user clicks inside popup, stop auto-close
document.addEventListener("click", (e) => {
  if (e.target.closest("#sharePopup")) {
    clearTimeout(autoClose);
  }
});
// ===============================
// CLOSE POPUP
// ===============================
document.addEventListener(
  "click",
  (e) => {

    if (
      e.target.id ===
      "closeSharePopup"
    ) {

      document.getElementById("sharePopup")
        ?.classList.remove("show");
    }
  }
);

// ===============================
// SHARE BUTTON
// ===============================
document.addEventListener(
  "click",
  async (e) => {

    if (
      e.target.id !==
      "shareBusinessBtn"
    ) {

      return;
    }

    const b =
      window.currentBusiness || {};

    const shareData = {

      title:
        `${b.name || "Business"} | ${b.category || ""} in ${b.town || ""}`,

      text:
        `${b.name || ""} - ${b.category || ""} in ${b.town || ""}`,

      url:
        window.location.href
    };

    if (navigator.share) {

      try {

        await navigator.share(
          shareData
        );

      } catch (err) {

        console.log(
          "Share cancelled"
        );
      }

    } else {

      try {

        await navigator.clipboard
          .writeText(
            window.location.href
          );

        e.target.textContent =
          "Link Copied!";

        setTimeout(() => {

          e.target.textContent =
            "Share This Business";

        }, 2000);

      } catch (err) {

        alert(
          "Could not copy link"
        );
      }
    }
  }
);
