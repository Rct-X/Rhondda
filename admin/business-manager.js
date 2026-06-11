// ======================================
// BUSINESS MANAGER
// ======================================

let db = null;
let auth = null;

// ======================================
// DOM
// ======================================

let bmList;
let bmSearch;
let bmTownFilter;
let bmCategoryFilter;

let bmEditPanel;
let bmBackBtn;
let bmEditErrors;

let bmEditId;

let bmName;
let bmCategorySlug;
let bmTown;
let bmTownSlug;
let bmSlug;
let bmUrlPreview;

let bmDescription;
let bmKeywords;
let bmAutoKeywordsBtn;

let bmEmail;
let bmPhone;
let bmWebsite;
let bmAddress;

let bmSaveBtn;

// ======================================
// STATE
// ======================================

let allBusinesses = [];
let currentBusinessId = null;

let initialised = false;

// ======================================
// INIT
// ======================================

export async function initBusinessManager(services) {

  // Prevent duplicate listeners
  if (initialised) return;

  initialised = true;

  db = services.db;
  auth = services.auth;

  console.log("[BM] Initialising");

  // ====================================
  // DOM CACHE
  // ====================================

  bmList = document.getElementById("bmList");

  bmSearch =
    document.getElementById("bmSearch");

  bmTownFilter =
    document.getElementById("bmTownFilter");

  bmCategoryFilter =
    document.getElementById("bmCategoryFilter");

  bmEditPanel =
    document.getElementById("bmEditPanel");

  bmBackBtn =
    document.getElementById("bmBackBtn");

  bmEditErrors =
    document.getElementById("bmEditErrors");

  bmEditId =
    document.getElementById("bmEditId");

  bmName =
    document.getElementById("bmName");

  bmCategorySlug =
    document.getElementById("bmCategorySlug");

  bmTown =
    document.getElementById("bmTown");

  bmTownSlug =
    document.getElementById("bmTownSlug");

  bmSlug =
    document.getElementById("bmSlug");

  bmUrlPreview =
    document.getElementById("bmUrlPreview");

  bmDescription =
    document.getElementById("bmDescription");

  bmKeywords =
    document.getElementById("bmKeywords");

  bmAutoKeywordsBtn =
    document.getElementById("bmAutoKeywordsBtn");

  bmEmail =
    document.getElementById("bmEmail");

  bmPhone =
    document.getElementById("bmPhone");

  bmWebsite =
    document.getElementById("bmWebsite");

  bmAddress =
    document.getElementById("bmAddress");

  bmSaveBtn =
    document.getElementById("bmSaveBtn");

  // ====================================
  // EVENTS
  // ====================================

  bmSearch?.addEventListener(
    "input",
    renderList
  );

  bmTownFilter?.addEventListener(
    "input",
    renderList
  );

  bmCategoryFilter?.addEventListener(
    "input",
    renderList
  );

  bmBackBtn?.addEventListener(
    "click",
    closeEditPanel
  );

  bmAutoKeywordsBtn?.addEventListener(
    "click",
    autoGenerateKeywords
  );

  bmName?.addEventListener(
    "input",
    updateUrlPreview
  );

  bmCategorySlug?.addEventListener(
    "input",
    updateUrlPreview
  );

  bmTownSlug?.addEventListener(
    "input",
    updateUrlPreview
  );

  bmSlug?.addEventListener(
    "input",
    updateUrlPreview
  );

  bmSaveBtn?.addEventListener(
    "click",
    saveBusiness
  );

  // ====================================
  // LOAD
  // ====================================

  await loadBusinesses();

}

// ======================================
// LOAD BUSINESSES
// ======================================

async function loadBusinesses() {

  bmList.innerHTML = `
    <div class="loading-state">
      Loading businesses...
    </div>
  `;

  try {

    const snap = await db
      .collection("businesses")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    allBusinesses = [];

    snap.forEach(doc => {

      allBusinesses.push({
        id: doc.id,
        ...doc.data()
      });

    });

    renderList();

  } catch (err) {

    console.error("[BM LOAD ERROR]", err);

    bmList.innerHTML = `
      <div class="admin-message error">
        Failed to load businesses.
      </div>
    `;

  }

}

// ======================================
// RENDER LIST
// ======================================

function renderList() {

  const term =
    (bmSearch?.value || "")
    .toLowerCase()
    .trim();

  const townFilter =
    (bmTownFilter?.value || "")
    .toLowerCase()
    .trim();

  const catFilter =
    (bmCategoryFilter?.value || "")
    .toLowerCase()
    .trim();

  const filtered = allBusinesses.filter(b => {

    const name =
      (b.name || "").toLowerCase();

    const town =
      (b.town || "").toLowerCase();

    const category =
      (
        b.category ||
        b.categorySlug ||
        ""
      ).toLowerCase();

    const keywords =
      (b.keywords || [])
      .join(" ")
      .toLowerCase();

    if (term) {

      const haystack =
        `${name} ${town} ${category} ${keywords}`;

      if (!haystack.includes(term)) {
        return false;
      }

    }

    if (
      townFilter &&
      !town.includes(townFilter)
    ) {
      return false;
    }

    if (
      catFilter &&
      !category.includes(catFilter)
    ) {
      return false;
    }

    return true;

  });

  // ====================================
  // EMPTY
  // ====================================

  if (!filtered.length) {

    bmList.innerHTML = `
      <div class="loading-state">
        No businesses found.
      </div>
    `;

    return;

  }

  // ====================================
  // RENDER
  // ====================================

  bmList.innerHTML = filtered.map(b => {

    const status =
      b.status || "approved";

    return `

      <article class="admin-card business-row">

        <div class="section-head">

          <div>

            <h3>
              ${escapeHtml(b.name || "Unnamed Business")}
            </h3>

            <p>
              ${escapeHtml(
                b.category ||
                b.categorySlug ||
                "No category"
              )}
              •
              ${escapeHtml(
                b.town || "No town"
              )}
            </p>

          </div>

          <span class="admin-badge">
            ${escapeHtml(status)}
          </span>

        </div>

        <div class="action-row">

          <button
            class="btn btn-secondary bm-edit-btn"
            data-id="${b.id}"
          >

            Edit Business

          </button>

        </div>

      </article>

    `;

  }).join("");

  // ====================================
  // BUTTON EVENTS
  // ====================================

  bmList
    .querySelectorAll(".bm-edit-btn")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        const id =
          btn.dataset.id;

        const business =
          allBusinesses.find(
            x => x.id === id
          );

        if (business) {
          openEdit(business);
        }

      });

    });

}

// ======================================
// OPEN EDIT
// ======================================

function openEdit(business) {

  currentBusinessId = business.id;

  bmEditPanel.style.display = "block";

  bmEditPanel.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });

  bmEditErrors.style.display = "none";
  bmEditErrors.textContent = "";

  bmEditId.textContent =
    `Business ID: ${business.id}`;

  bmName.value =
    business.name || "";

  bmCategorySlug.value =
    business.categorySlug ||
    business.category ||
    "";

  bmTown.value =
    business.town || "";

  bmTownSlug.value =
    business.townSlug || "";

  bmSlug.value =
    business.slug || "";

  bmDescription.value =
    business.description || "";

  bmKeywords.value =
    (business.keywords || []).join(", ");

  bmEmail.value =
    business.email || "";

  bmPhone.value =
    business.phone || "";

  bmWebsite.value =
    business.website || "";

  bmAddress.value =
    business.address || "";

  updateUrlPreview();

}

// ======================================
// CLOSE EDIT
// ======================================

function closeEditPanel() {

  currentBusinessId = null;

  bmEditPanel.style.display = "none";

}

// ======================================
// URL PREVIEW
// ======================================

function updateUrlPreview() {

  const category =
    (bmCategorySlug.value || "{category}")
    .trim();

  const town =
    (bmTownSlug.value || "{town}")
    .trim();

  const slug =
    (bmSlug.value || "{slug}")
    .trim();

  bmUrlPreview.textContent =
    `https://rctx.co.uk/directory/${category}/${town}/${slug}`;

}

// ======================================
// AUTO KEYWORDS
// ======================================

function autoGenerateKeywords() {

  const name =
    (bmName.value || "")
    .toLowerCase();

  const town =
    (bmTown.value || "")
    .toLowerCase();

  const category =
    (bmCategorySlug.value || "")
    .toLowerCase();

  const description =
    (bmDescription.value || "")
    .toLowerCase();

  const keywords = [];

  if (name) {

    keywords.push(name);

    keywords.push(
      name
        .replace(
          /designs|services|limited|ltd/g,
          ""
        )
        .trim()
    );

  }

  if (town) {

    keywords.push(town);

    if (name) {
      keywords.push(`${name} ${town}`);
    }

  }

  if (category) {

    keywords.push(category);

    if (town) {
      keywords.push(`${category} ${town}`);
    }

  }

  if (description.includes("gift")) {

    keywords.push(
      "gift shop",
      "gifts",
      "presents"
    );

  }

  if (description.includes("baby")) {

    keywords.push(
      "baby shop",
      "baby gifts",
      "baby clothes"
    );

  }

  const existing =
    bmKeywords.value
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

  const merged = [
    ...existing,
    ...keywords
  ]
    .filter(Boolean)
    .filter(
      (k, i, arr) =>
        arr.indexOf(k) === i
    );

  bmKeywords.value =
    merged.join(", ");

}

// ======================================
// SAVE BUSINESS
// ======================================

async function saveBusiness() {

  if (!currentBusinessId) {
    return;
  }

  const name =
    bmName.value.trim();

  const categorySlug =
    bmCategorySlug.value.trim();

  const town =
    bmTown.value.trim();

  const townSlug =
    bmTownSlug.value.trim();

  const slug =
    bmSlug.value.trim();

  const description =
    bmDescription.value.trim();

  const keywords =
    bmKeywords.value
      .split(",")
      .map(k => k.trim())
      .filter(Boolean);

  const email =
    bmEmail.value.trim();

  const phone =
    bmPhone.value.trim();

  const website =
    bmWebsite.value.trim();

  const address =
    bmAddress.value.trim();

  const errors = [];

  if (!name) {
    errors.push("Name is required.");
  }

  if (!categorySlug) {
    errors.push("Category slug required.");
  }

  if (!town) {
    errors.push("Town required.");
  }

  if (!townSlug) {
    errors.push("Town slug required.");
  }

  if (!slug) {
    errors.push("Business slug required.");
  }

  // ====================================
  // VALIDATION
  // ====================================

  if (errors.length) {

    bmEditErrors.style.display = "block";

    bmEditErrors.innerHTML = `
      <strong>Please fix:</strong>
      <br><br>
      • ${errors.join("<br>• ")}
    `;

    return;

  }

  bmEditErrors.style.display = "none";

  bmSaveBtn.disabled = true;
  bmSaveBtn.textContent = "Saving...";

  try {

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/updateBusiness",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          "Authorization":
            `Bearer ${token}`
        },
        body: JSON.stringify({
          id: currentBusinessId,
          name,
          categorySlug,
          town,
          townSlug,
          slug,
          description,
          keywords,
          email,
          phone,
          website,
          address
        })
      }
    );

    if (!res.ok) {
      throw new Error(
        "Failed to update business"
      );
    }

    // ==================================
    // UPDATE CACHE
    // ==================================

    const index =
      allBusinesses.findIndex(
        b => b.id === currentBusinessId
      );

    if (index !== -1) {

      allBusinesses[index] = {

        ...allBusinesses[index],

        name,
        categorySlug,
        category: categorySlug,
        town,
        townSlug,
        slug,
        description,
        keywords,
        email,
        phone,
        website,
        address

      };

    }

    renderList();

    bmSaveBtn.textContent =
      "Saved Successfully";

    setTimeout(() => {

      bmSaveBtn.textContent =
        "Save Changes";

    }, 1500);

  } catch (err) {

    console.error(
      "[BM SAVE ERROR]",
      err
    );

    bmEditErrors.style.display =
      "block";

    bmEditErrors.textContent =
      "Failed to save business.";

  } finally {

    bmSaveBtn.disabled = false;

  }

}

// ======================================
// HELPERS
// ======================================

function escapeHtml(str = "") {

  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}
