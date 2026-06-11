// ======================================
// PENDING.JS
// Handles Pending Submissions ONLY
// ======================================

let db = null;
let auth = null;

// DOM refs for review panel
let reviewPanel;
let dashboardTab;

let reviewErrors;
let reviewName;
let reviewCategoryRaw;
let reviewTown;
let reviewDescription;
let reviewCollectsWaste;
let reviewWasteLicence;
let reviewEmail;
let reviewPhone;
let reviewWebsite;
let reviewAddress;

let reviewCategorySelect;
let reviewCategorySlug;
let reviewTownSlug;
let reviewBusinessSlug;

let categorySlugHint;
let townSlugHint;
let businessSlugHint;

let urlPreview;
let urlStatus;

let approveBtn;
let rejectBtn;
let backBtn;

let currentPendingId = null;
let currentPendingData = null;

// ======================================
// INIT
// ======================================

export async function initPending(services) {
  db = services.db;
  auth = services.auth;

  console.log("[PENDING] Initialising pending submissions module");

  // Cache DOM
  dashboardTab = document.getElementById("dashboardTab");
  reviewPanel = document.getElementById("reviewPanel");

  reviewErrors = document.getElementById("reviewErrors");

  reviewName = document.getElementById("reviewName");
  reviewCategoryRaw = document.getElementById("reviewCategoryRaw");
  reviewTown = document.getElementById("reviewTown");
  reviewDescription = document.getElementById("reviewDescription");
  reviewCollectsWaste = document.getElementById("reviewCollectsWaste");
  reviewWasteLicence = document.getElementById("reviewWasteLicence");
  reviewEmail = document.getElementById("reviewEmail");
  reviewPhone = document.getElementById("reviewPhone");
  reviewWebsite = document.getElementById("reviewWebsite");
  reviewAddress = document.getElementById("reviewAddress");

  reviewCategorySelect = document.getElementById("reviewCategorySelect");
  reviewCategorySlug = document.getElementById("reviewCategorySlug");
  reviewTownSlug = document.getElementById("reviewTownSlug");
  reviewBusinessSlug = document.getElementById("reviewBusinessSlug");

  categorySlugHint = document.getElementById("categorySlugHint");
  townSlugHint = document.getElementById("townSlugHint");
  businessSlugHint = document.getElementById("businessSlugHint");

  urlPreview = document.getElementById("urlPreview");
  urlStatus = document.getElementById("urlStatus");

  approveBtn = document.getElementById("approveBtn");
  rejectBtn = document.getElementById("rejectBtn");
  backBtn = document.getElementById("backToDashboardBtn");

  // Bind events
  backBtn.addEventListener("click", closeReviewPanel);
  approveBtn.addEventListener("click", approveSubmission);
  rejectBtn.addEventListener("click", rejectSubmission);

  reviewCategorySelect.addEventListener("change", () => {
    reviewCategorySlug.value = reviewCategorySelect.value;
    validateAndPreview();
  });

  reviewCategorySlug.addEventListener("input", validateAndPreview);
  reviewTownSlug.addEventListener("input", validateAndPreview);
  reviewBusinessSlug.addEventListener("input", validateAndPreview);

  // Load pending submissions
  await loadPendingSubmissions();
}

// ======================================
// CATEGORY LIST
// ======================================

const categories = [
  { name: "Plumbers", slug: "plumbers" },
  { name: "Electricians", slug: "electricians" },
  { name: "Builders", slug: "builders" },
  { name: "Roofers", slug: "roofers" },
  { name: "Painters & Decorators", slug: "painters-decorators" },
  { name: "Handyman Services", slug: "handyman-services" },
  { name: "Cleaners", slug: "cleaners" },
  { name: "Window Cleaners", slug: "window-cleaners" },
  { name: "Gardeners", slug: "gardeners" },
  { name: "Waste Collection", slug: "waste-collection" },
  { name: "Man With A Van", slug: "man-with-a-van" },
  { name: "Removals", slug: "removals" },
  { name: "Car Mechanics", slug: "car-mechanics" },
  { name: "Tyres & Repairs", slug: "tyres" },
  { name: "Barbers", slug: "barbers" },
  { name: "Hairdressers", slug: "hairdressers" },
  { name: "Beauty Salons", slug: "beauty-salons" },
  { name: "Dog Groomers", slug: "dog-groomers" },
  { name: "Cafes", slug: "cafes" },
  { name: "Restaurants", slug: "restaurants" },
  { name: "Takeaways", slug: "takeaways" },
  { name: "Shops", slug: "shops" },
  { name: "Gyms", slug: "gyms" },
  { name: "Photographers", slug: "photographers" }
];

// ======================================
// LOAD PENDING SUBMISSIONS
// ======================================

async function loadPendingSubmissions() {
  const list = document.getElementById("pendingList");
  list.innerHTML = "<p>Loading submissions…</p>";

  const snap = await db
    .collection("pending_submissions")
    .orderBy("createdAt", "desc")
    .get();

  if (snap.empty) {
    list.innerHTML = "<p>No pending submissions.</p>";
    return;
  }

  list.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();
    const id = doc.id;

    const item = document.createElement("div");
    item.className = "pending-item";

    item.innerHTML = `
      <h3>${b.name}</h3>
      <p><strong>Raw Category:</strong> ${b.categoryRaw}</p>
      <p><strong>Town:</strong> ${b.town}</p>
      <button class="btn btn-secondary" data-id="${id}">
        Review & Approve
      </button>
    `;

    item.querySelector("button").addEventListener("click", () => {
      openReviewPanel(id, b);
    });

    list.appendChild(item);
  });
}

// ======================================
// OPEN REVIEW PANEL
// ======================================

function openReviewPanel(id, data) {
  currentPendingId = id;
  currentPendingData = data;

  dashboardTab.style.display = "none";
  reviewPanel.style.display = "block";

  // Fill read-only info
  reviewName.textContent = data.name;
  reviewCategoryRaw.textContent = data.categoryRaw;
  reviewTown.textContent = data.town;
  reviewDescription.textContent = data.description;
  reviewCollectsWaste.textContent = data.collectsWaste;
  reviewWasteLicence.textContent = data.wasteLicence || "-";
  reviewEmail.textContent = data.email || "-";
  reviewPhone.textContent = data.phone || "-";
  reviewWebsite.textContent = data.website || "-";
  reviewAddress.textContent = data.address || "-";

  // Populate category dropdown
  reviewCategorySelect.innerHTML = `<option value="">Select category…</option>`;
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.slug;
    opt.textContent = `${c.name} — ${c.slug}`;
    reviewCategorySelect.appendChild(opt);
  });

  // Auto-fill slugs
  reviewTownSlug.value = data.townSlug || slugify(data.town);
  reviewBusinessSlug.value = data.slug || slugify(data.name);
  reviewCategorySlug.value = "";

  validateAndPreview();
}

function closeReviewPanel() {
  reviewPanel.style.display = "none";
  dashboardTab.style.display = "block";
}

// ======================================
// VALIDATION + URL PREVIEW
// ======================================

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const knownTowns = [
  "aberaman","abercwmboi","abercynon","aberdare","abernant","beddau",
  "blaenrhondda","blaenclydach","blaencwm","blaenllechau","brynna",
  "caegarw","carnetown","cefn-rhigos","cefnpennar","church-village",
  "cilfynydd","clydach-vale","coedely","cwmaman","cwmbach","cwmdare",
  "cwmparc","cwmpennar","cymmer","dinas-rhondda","efail-isaf","ferndale",
  "fernhill","gelli","gilfach-goch","glenboi","glyncoch","glyntaff",
  "groesfaen","hirwaun","llanharan","llanharry","llantrisant",
  "llantwit-fardre","llwydcoed","llwynypia","maerdy","miskin",
  "mountain-ash","penderyn","penrhiwceiber","penrhiwfer","penrhys",
  "pentre","pen-y-waun","penygraig","perthcelyn","pontcynon",
  "pontyclun","pontygwaith","pontypridd","porth","rhigos","stanleytown",
  "taffs-well","talbot-green","tonteg","ton-pentre","tonypandy",
  "tonyrefail","trealaw","trebanog","trecynon","treforest","trehafod",
  "treherbert","treorchy","tylorstown","tynewydd","upper-boat",
  "wattstown","williamstown","ynysboeth","ynyshir","ynysmaerdy",
  "ynyswen","ynysybwl","ystrad"
];

function validateAndPreview() {
  const errors = [];

  const categorySlug = reviewCategorySlug.value.trim();
  const townSlug = reviewTownSlug.value.trim();
  const businessSlug = reviewBusinessSlug.value.trim();

  // CATEGORY SLUG
  if (!categorySlug) {
    errors.push("Category slug is required.");
    categorySlugHint.textContent = "❌ Required.";
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(categorySlug)) {
    errors.push("Category slug must be lowercase and hyphens only.");
    categorySlugHint.textContent = "❌ Invalid format.";
  } else {
    categorySlugHint.textContent = "✔ Looks good.";
  }

  // TOWN SLUG
  if (!townSlug) {
    errors.push("Town slug is required.");
    townSlugHint.textContent = "❌ Required.";
  } else if (!knownTowns.includes(townSlug)) {
    errors.push(`Town slug "${townSlug}" is not recognised.`);
    townSlugHint.textContent = "❌ Not a valid RCT town.";
  } else {
    townSlugHint.textContent = "✔ Recognised town.";
  }

  // BUSINESS SLUG
  if (!businessSlug) {
    errors.push("Business slug is required.");
    businessSlugHint.textContent = "❌ Required.";
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(businessSlug)) {
    errors.push("Business slug must be lowercase and hyphens only.");
    businessSlugHint.textContent = "❌ Invalid format.";
  } else {
    businessSlugHint.textContent = "✔ Looks good.";
  }

  // URL PREVIEW
  const url = `https://rctx.co.uk/directory/${categorySlug || "{category}"}/${townSlug || "{town}"}/${businessSlug || "{slug}"}`;
  urlPreview.textContent = url;

  if (errors.length) {
    reviewErrors.style.display = "block";
    reviewErrors.innerHTML = "❌ Errors found:<br>• " + errors.join("<br>• ");
    urlStatus.textContent = "❌ URL invalid.";
    return false;
  }

  reviewErrors.style.display = "none";
  urlStatus.textContent = "✔ URL looks valid.";
  return true;
}

// ======================================
// APPROVE SUBMISSION
// ======================================

async function approveSubmission() {
  if (!validateAndPreview()) {
    alert("Fix the errors before approving.");
    return;
  }

  const categorySlug = reviewCategorySlug.value.trim();
  const townSlug = reviewTownSlug.value.trim();
  const businessSlug = reviewBusinessSlug.value.trim();

  const finalUrl = `https://rctx.co.uk/directory/${categorySlug}/${townSlug}/${businessSlug}`;

  if (!confirm(`Publish this business?\n\n${finalUrl}`)) return;

  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/.netlify/functions/approveBusiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      id: currentPendingId,
      categorySlug,
      townSlug,
      businessSlug
    })
  });

  if (!res.ok) {
    alert("Failed to approve.");
    return;
  }

  alert("Business approved.");
  closeReviewPanel();
  loadPendingSubmissions();
}

// ======================================
// REJECT SUBMISSION
// ======================================

async function rejectSubmission() {
  if (!confirm("Reject and delete this submission?")) return;

  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/.netlify/functions/rejectBusiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id: currentPendingId })
  });

  if (!res.ok) {
    alert("Failed to reject.");
    return;
  }

  alert("Submission rejected.");
  closeReviewPanel();
  loadPendingSubmissions();
}
