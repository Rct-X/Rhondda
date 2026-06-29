// ======================================
// PROPERTY BUILDER
// RCTX Holiday Admin
// ======================================

let db;
let auth;
let container;

// Current step
let currentStep = 0;

// Property being built
let property = createEmptyProperty();

// ======================================
// STEP DEFINITIONS
// ======================================

const STEPS = [

  "Basic",
  "Hero",
  "Welcome",
  "About",
  "Experience",
  "Details",
  "Features",
  "Gallery",
  "Park",
  "Location",
  "Reviews",
  "SEO",
  "Contact",
  "Footer",
  "Review"

];

// ======================================
// PUBLIC INIT
// ======================================

export function initPropertyBuilder({
  db: firestore,
  auth: firebaseAuth,
  container: element
}) {

  db = firestore;
  auth = firebaseAuth;
  container = element;

  render();
bindEvents();
bindStepInputs();

}

// ======================================
// EMPTY PROPERTY
// ======================================

function createEmptyProperty() {

  return {

    id: "",

    status: "draft",

    siteDomain: "",

    hero: {},

    welcome: {},

    about: {},

    experience: {},

    details: {},

    features: [],

    gallery: {

      images: []

    },

    park: {

      facilities: []

    },

    location: {},

    reviews: {

      items: []

    },

    seo: {},

    contact: {},

    footer: {}

  };

}

// ======================================
// MAIN RENDER
// ======================================

function render() {

  container.innerHTML = `

<div class="builder">

<div id="builderHeader"></div>

<div id="builderProgress"></div>

<div id="builderContent"></div>

<div id="builderFooter"></div>

</div>

`;

  renderHeader();

  renderProgress();

  renderCurrentStep();

  renderFooter();

}

// ======================================
// HEADER
// ======================================

function renderHeader() {

  document.getElementById("builderHeader").innerHTML = `

<div class="page-header">

<h1>Add Property</h1>

<p>Create a holiday property.</p>

</div>

`;

}

// ======================================
// PROGRESS
// ======================================

function renderProgress() {

  const percent =
    Math.round(
      ((currentStep + 1) / STEPS.length) * 100
    );

  document.getElementById("builderProgress").innerHTML = `

<div class="builder-progress">

<div>

Step ${currentStep + 1}
of
${STEPS.length}

</div>

<div>

${STEPS[currentStep]}

</div>

<div class="progress-bar">

<div
class="progress-fill"
style="width:${percent}%">
</div>

</div>

</div>

`;

}

// ======================================
// STEP CONTENT
// ======================================

function renderCurrentStep() {

  const box =
    document.getElementById("builderContent");

  switch (STEPS[currentStep]) {

    case "Basic":

      box.innerHTML = `

<div class="builder-card">

<h2>Basic Information</h2>

<div class="field">

<label>

Property Name

</label>

<input
id="propertyName"
type="text"
placeholder="Ty Glas Cottage">

</div>

<div class="field">

<label>

Property ID

</label>

<input
id="propertyId"
type="text"
placeholder="ty-glas-cottage">

</div>

<div class="field">

<label>

Status

</label>

<select id="propertyStatus">

<option value="draft">

Draft

</option>

<option value="live">

Live

</option>

</select>

</div>

<div class="field">

<label>

Site Domain

</label>

<input
id="siteDomain"
placeholder="holiday.rctx.co.uk">

</div>

</div>

`;

      break;

    default:

      box.innerHTML = `

<div class="builder-card">

<h2>

${STEPS[currentStep]}

</h2>

<p>

This page will be built next.

</p>

</div>

`;

      break;

  }

}

// ======================================
// FOOTER
// ======================================

function renderFooter() {

  document.getElementById("builderFooter").innerHTML = `

<div class="builder-footer">

<button
id="builderPrev"
class="btn btn-secondary">

Previous

</button>

<button
id="builderNext"
class="btn btn-primary">

Next

</button>

</div>

`;

}

// ======================================
// EVENTS
// ======================================

function bindEvents() {

  document.addEventListener("click", handleClicks);

}

// ======================================
// CLICK HANDLER
// ======================================

function handleClicks(e) {

  if (e.target.id === "builderNext") {

    nextStep();

    return;

  }

  if (e.target.id === "builderPrev") {

    previousStep();

    return;

  }

}

// ======================================
// NEXT PREVIOUS STEP
// ======================================

function nextStep() {

  if (currentStep >= STEPS.length - 1) return;

  currentStep++;

  renderProgress();
  renderCurrentStep();
  restoreStepData();

}

function previousStep() {

  if (currentStep <= 0) return;

  currentStep--;

  renderProgress();
  renderCurrentStep();
  restoreStepData();

}



// ======================================
// INPUT BINDING + DATA SYNC
// ======================================

function bindStepInputs() {

  document.addEventListener("input", (e) => {

    // BASIC STEP INPUTS
    if (STEPS[currentStep] === "Basic") {

      if (e.target.id === "propertyName") {

        const name = e.target.value;

        property.hero.title = name;

        // auto-generate ID if empty or unchanged
        const slug = slugify(name);

        const idInput =
          document.getElementById("propertyId");

        if (idInput && !idInput.dataset.locked) {

          idInput.value = slug;

          property.id = slug;

        }

      }

      if (e.target.id === "propertyId") {

        property.id = e.target.value;

        e.target.dataset.locked = "true";

      }

      if (e.target.id === "propertyStatus") {

        property.status = e.target.value;

      }

      if (e.target.id === "siteDomain") {

        property.siteDomain = e.target.value;

      }

    }

  });

}

// ======================================
// SLUGIFY
// ======================================

function slugify(text) {

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

}

// ======================================
// STEP STATE RESTORE
// ======================================

function restoreStepData() {

  if (STEPS[currentStep] === "Basic") {

    const name =
      document.getElementById("propertyName");

    const id =
      document.getElementById("propertyId");

    const status =
      document.getElementById("propertyStatus");

    const domain =
      document.getElementById("siteDomain");

    if (name && property.hero?.title) {
      name.value = property.hero.title;
    }

    if (id && property.id) {
      id.value = property.id;
      id.dataset.locked = "true";
    }

    if (status && property.status) {
      status.value = property.status;
    }

    if (domain && property.siteDomain) {
      domain.value = property.siteDomain;
    }

  }

}

// ======================================
// FIRESTORE ID CHECK (SAFE)
// ======================================

async function checkPropertyExists(id) {

  if (!db || !id) return false;

  try {

    const snap =
      await db.collection("properties")
        .doc(id)
        .get();

    return snap.exists;

  } catch (err) {

    console.error("ID check failed:", err);

    return false;

  }

}

// ======================================
// PATCH RENDER CURRENT STEP
// ======================================

// override existing function safely
const oldRenderCurrentStep = renderCurrentStep;

renderCurrentStep = function () {

  oldRenderCurrentStep();

  restoreStepData();

};



// ======================================
// VALIDATION ENGINE
// ======================================

const REQUIRED_FIELDS = {

  Basic: ["hero.title", "id"],

  Hero: [],

  Welcome: ["welcome.title", "welcome.lead"],

  About: ["about.title", "about.text"],

  Experience: ["experience.title", "experience.text"],

  Details: ["details.town", "details.postcode"],

  Features: [],

  Gallery: ["gallery.images"],

  Park: [],

  Location: ["location.postcode"],

  Reviews: [],

  SEO: ["seo.title", "seo.description"],

  Contact: ["contact.email"],

  Footer: []

};

// ======================================
// GET VALUE BY PATH
// ======================================

function getValue(path, obj = property) {

  return path.split(".").reduce((acc, key) => {

    return acc ? acc[key] : undefined;

  }, obj);

}

// ======================================
// VALIDATE STEP
// ======================================

function validateStep(stepName) {

  const required =
    REQUIRED_FIELDS[stepName] || [];

  const errors = [];

  required.forEach(field => {

    const value = getValue(field);

    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      errors.push(field);
    }

  });

  return errors;

}

// ======================================
// SHOW VALIDATION UI
// ======================================

function renderValidation(errors) {

  const box =
    document.getElementById("builderContent");

  if (!errors.length) return;

  const html = errors.map(e => {

    return `<div style="
      padding:10px;
      margin:5px 0;
      background:#ffe6e6;
      border:1px solid #ff5c5c;
      border-radius:6px;
      font-size:14px;
    ">
      Missing: ${e}
    </div>`;

  }).join("");

  box.innerHTML += `

    <div class="validation-box">

      <h3>Fix required fields</h3>

      ${html}

    </div>

  `;

}

// ======================================
// PATCH NEXT STEP (VALIDATION)
// ======================================

const oldNextStep = nextStep;

nextStep = function () {

  const stepName = STEPS[currentStep];

  const errors = validateStep(stepName);

  if (errors.length > 0) {

    renderValidation(errors);

    return; // BLOCK progression

  }

  if (currentStep >= STEPS.length - 1) return;

  currentStep++;

  renderProgress();
  renderCurrentStep();
  restoreStepData();

};

// ======================================
// COMPLETION SCORE (PROGRESS UPGRADE)
// ======================================

function calculateCompletion() {

  let totalFields = 0;
  let filledFields = 0;

  Object.keys(REQUIRED_FIELDS).forEach(step => {

    REQUIRED_FIELDS[step].forEach(path => {

      totalFields++;

      const value = getValue(path);

      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        (!Array.isArray(value) || value.length > 0)
      ) {
        filledFields++;
      }

    });

  });

  return Math.round((filledFields / totalFields) * 100);

}

// ======================================
// PATCH PROGRESS RENDER
// ======================================

const oldRenderProgress = renderProgress;

renderProgress = function () {

  const percent =
    Math.round(
      ((currentStep + 1) / STEPS.length) * 100
    );

  const completion = calculateCompletion();

  document.getElementById("builderProgress").innerHTML = `

<div class="builder-progress">

  <div>

    Step ${currentStep + 1} of ${STEPS.length}

  </div>

  <div>

    ${STEPS[currentStep]}

  </div>

  <div class="progress-bar">

    <div class="progress-fill"
         style="width:${percent}%">
    </div>

  </div>

  <div style="margin-top:6px;font-size:13px;opacity:0.8;">

    Completion: ${completion}%

  </div>

</div>

`;

};


// ======================================
// FIRESTORE SAVE SYSTEM
// ======================================

let isSaving = false;

// ======================================
// SAVE DRAFT BUTTON (ADD TO FOOTER LATER)
// ======================================

async function saveDraft() {

  if (!db) return;

  if (!property.id) {
    alert("Property ID missing");
    return;
  }

  if (isSaving) return;

  isSaving = true;

  showSaveState("Saving draft...");

  try {

    const exists = await checkPropertyExists(property.id);

    const ref = db.collection("properties").doc(property.id);

    const payload = {

      ...property,

      updatedAt: firebase.firestore.FieldValue.serverTimestamp()

    };

    // CREATE OR UPDATE
    if (exists) {

      await ref.set(payload, { merge: true });

    } else {

      await ref.set(payload);

    }

    showSaveState("Saved ✓");

  } catch (err) {

    console.error("Save failed:", err);

    showSaveState("Save failed ❌");

  } finally {

    isSaving = false;

  }

}

// ======================================
// SHOW SAVE STATE (MOBILE FRIENDLY)
// ======================================

function showSaveState(text) {

  let el = document.getElementById("saveStateBox");

  if (!el) {

    el = document.createElement("div");

    el.id = "saveStateBox";

    el.style.cssText = `

      position: fixed;
      bottom: 80px;
      left: 10px;
      right: 10px;
      background: #111;
      color: white;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      z-index: 9999;
      text-align: center;

    `;

    document.body.appendChild(el);

  }

  el.textContent = text;

}

// ======================================
// INTEGRATE SAVE INTO FOOTER
// ======================================

const oldRenderFooter = renderFooter;

renderFooter = function () {

  document.getElementById("builderFooter").innerHTML = `

<div class="builder-footer">

  <button id="builderPrev" class="btn btn-secondary">
    Previous
  </button>

  <button id="saveDraftBtn" class="btn btn-outline">
    Save Draft
  </button>

  <button id="builderNext" class="btn btn-primary">
    Next
  </button>

</div>

`;

};

// ======================================
// PATCH CLICK HANDLER
// ======================================

const oldHandleClicks = handleClicks;

handleClicks = function (e) {

  if (e.target.id === "saveDraftBtn") {

    saveDraft();

    return;

  }

  if (oldHandleClicks) {
    oldHandleClicks(e);
  }

};
