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
// NEXT STEP
// ======================================

function nextStep() {

  if (currentStep >= STEPS.length - 1) {

    return;

  }

  currentStep++;

  renderProgress();

  renderCurrentStep();

}

// ======================================
// PREVIOUS STEP
// ======================================

function previousStep() {

  if (currentStep <= 0) {

    return;

  }

  currentStep--;

  renderProgress();

  renderCurrentStep();

      }
