// ======================================
// BUSINESS-MANAGER.JS
// Manage existing businesses
// ======================================

let db = null;
let auth = null;

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

let allBusinesses = [];
let currentBusinessId = null;

// ===============================
// INIT
// ===============================
export async function initBusinessManager(services) {
  db = services.db;
  auth = services.auth;

  console.log("[BM] Initialising Business Manager");

  bmList = document.getElementById("bmList");
  bmSearch = document.getElementById("bmSearch");
  bmTownFilter = document.getElementById("bmTownFilter");
  bmCategoryFilter = document.getElementById("bmCategoryFilter");

  bmEditPanel = document.getElementById("bmEditPanel");
  bmBackBtn = document.getElementById("bmBackBtn");
  bmEditErrors = document.getElementById("bmEditErrors");

  bmEditId = document.getElementById("bmEditId");

  bmName = document.getElementById("bmName");
  bmCategorySlug = document.getElementById("bmCategorySlug");
  bmTown = document.getElementById("bmTown");
  bmTownSlug = document.getElementById("bmTownSlug");
  bmSlug = document.getElementById("bmSlug");
  bmUrlPreview = document.getElementById("bmUrlPreview");

  bmDescription = document.getElementById("bmDescription");
  bmKeywords = document.getElementById("bmKeywords");
  bmAutoKeywordsBtn = document.getElementById("bmAutoKeywordsBtn");

  bmEmail = document.getElementById("bmEmail");
  bmPhone = document.getElementById("bmPhone");
  bmWebsite = document.getElementById("bmWebsite");
  bmAddress = document.getElementById("bmAddress");

  bmSaveBtn = document.getElementById("bmSaveBtn");

  bmSearch.addEventListener("input", renderList);
  bmTownFilter.addEventListener("input", renderList);
  bmCategoryFilter.addEventListener("input", renderList);

  bmBackBtn.addEventListener("click", () => {
    bmEditPanel.style.display = "none";
    currentBusinessId = null;
  });

  bmAutoKeywordsBtn.addEventListener("click", autoGenerateKeywords);

  bmName.addEventListener("input", updateUrlPreview);
  bmCategorySlug.addEventListener("input", updateUrlPreview);
  bmTownSlug.addEventListener("input", updateUrlPreview);
  bmSlug.addEventListener("input", updateUrlPreview);

  bmSaveBtn.addEventListener("click", saveBusiness);

  await loadBusinesses();
}

// ===============================
// LOAD BUSINESSES
// ===============================
async function loadBusinesses() {
  bmList.innerHTML = "<p>Loading businesses…</p>";

  const snap = await db
    .collection("businesses")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  allBusinesses = [];
  snap.forEach(doc => {
    allBusinesses.push({ id: doc.id, ...doc.data() });
  });

  renderList();
}

// ===============================
// RENDER LIST
// ===============================
function renderList() {
  const term = (bmSearch.value || "").toLowerCase();
  const townFilter = (bmTownFilter.value || "").toLowerCase();
  const catFilter = (bmCategoryFilter.value || "").toLowerCase();

  const filtered = allBusinesses.filter(b => {
    const name = (b.name || "").toLowerCase();
    const town = (b.town || "").toLowerCase();
    const category = (b.category || b.categorySlug || "").toLowerCase();
    const keywords = (b.keywords || []).join(" ").toLowerCase();

    if (term) {
      const hay = `${name} ${town} ${category} ${keywords}`;
      if (!hay.includes(term)) return false;
    }

    if (townFilter && !town.includes(townFilter)) return false;
    if (catFilter && !category.includes(catFilter)) return false;

    return true;
  });

  if (!filtered.length) {
    bmList.innerHTML = "<p>No businesses found.</p>";
    return;
  }

  const rows = filtered
    .map(b => {
      const status = b.status || "approved";
      const town = b.town || "-";
      const category = b.category || b.categorySlug || "-";

      return `
        <div class="pending-item">
          <h3>${b.name || "(no name)"}</h3>
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Town:</strong> ${town}</p>
          <p><strong>Status:</strong> ${status}</p>
          <button class="btn btn-secondary" data-id="${b.id}">
            Edit
          </button>
        </div>
      `;
    })
    .join("");

  bmList.innerHTML = rows;

  bmList.querySelectorAll("button[data-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const b = allBusinesses.find(x => x.id === id);
      if (b) openEdit(b);
    });
  });
}

// ===============================
// OPEN EDIT PANEL
// ===============================
function openEdit(b) {
  currentBusinessId = b.id;

  bmEditPanel.style.display = "block";
  bmEditErrors.style.display = "none";
  bmEditErrors.textContent = "";

  bmEditId.textContent = `ID: ${b.id}`;

  bmName.value = b.name || "";
  bmCategorySlug.value = b.categorySlug || b.category || "";
  bmTown.value = b.town || "";
  bmTownSlug.value = b.townSlug || "";
  bmSlug.value = b.slug || "";

  bmDescription.value = b.description || "";

  bmKeywords.value = (b.keywords || []).join(", ");

  bmEmail.value = b.email || "";
  bmPhone.value = b.phone || "";
  bmWebsite.value = b.website || "";
  bmAddress.value = b.address || "";

  updateUrlPreview();
}

// ===============================
// URL PREVIEW
// ===============================
function updateUrlPreview() {
  const cat = (bmCategorySlug.value || "{category}").trim();
  const town = (bmTownSlug.value || "{town}").trim();
  const slug = (bmSlug.value || "{slug}").trim();

  bmUrlPreview.textContent = `https://rctx.co.uk/directory/${cat}/${town}/${slug}`;
}

// ===============================
// AUTO KEYWORDS
// ===============================
function autoGenerateKeywords() {
  const name = (bmName.value || "").toLowerCase();
  const town = (bmTown.value || "").toLowerCase();
  const cat = (bmCategorySlug.value || "").toLowerCase();
  const desc = (bmDescription.value || "").toLowerCase();

  const base = [];

  if (name) base.push(name, name.replace(/designs|ltd|limited|services/g, "").trim());
  if (town) base.push(town, `${name} ${town}`, `${cat} ${town}`);
  if (cat) base.push(cat, `${cat} ${town}`);

  if (desc.includes("baby")) {
    base.push("baby shop", "baby clothes", "baby gifts");
  }
  if (desc.includes("gift")) {
    base.push("gift shop", "gifts", "cards", "presents");
  }

  const existing = bmKeywords.value
    .split(",")
    .map(k => k.toLowerCase().trim())
    .filter(k => k.length);

  const merged = [...existing, ...base]
    .filter(k => k.length)
    .map(k => k.toLowerCase())
    .filter((k, i, arr) => arr.indexOf(k) === i);

  bmKeywords.value = merged.join(", ");
}

// ===============================
// SAVE BUSINESS
// ===============================
async function saveBusiness() {
  if (!currentBusinessId) return;

  const name = bmName.value.trim();
  const categorySlug = bmCategorySlug.value.trim();
  const town = bmTown.value.trim();
  const townSlug = bmTownSlug.value.trim();
  const slug = bmSlug.value.trim();

  const description = bmDescription.value.trim();

  const keywords = bmKeywords.value
    .split(",")
    .map(k => k.trim())
    .filter(k => k.length);

  const email = bmEmail.value.trim();
  const phone = bmPhone.value.trim();
  const website = bmWebsite.value.trim();
  const address = bmAddress.value.trim();

  const errors = [];

  if (!name) errors.push("Name is required.");
  if (!categorySlug) errors.push("Category slug is required.");
  if (!town) errors.push("Town is required.");
  if (!townSlug) errors.push("Town slug is required.");
  if (!slug) errors.push("Business slug is required.");

  if (errors.length) {
    bmEditErrors.style.display = "block";
    bmEditErrors.innerHTML = "❌ Errors:<br>• " + errors.join("<br>• ");
    return;
  }

  bmEditErrors.style.display = "none";

  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/.netlify/functions/updateBusiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
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
  });

  if (!res.ok) {
    bmEditErrors.style.display = "block";
    bmEditErrors.textContent = "Failed to save changes.";
    return;
  }

  alert("Business updated.");

  // Update local cache
  const idx = allBusinesses.findIndex(b => b.id === currentBusinessId);
  if (idx !== -1) {
    allBusinesses[idx] = {
      ...allBusinesses[idx],
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
}
