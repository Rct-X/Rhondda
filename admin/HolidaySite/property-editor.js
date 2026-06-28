let db;
let auth;
let container;
let currentPropertyId = null;

// ======================================
// INIT
// ======================================
export async function initPropertyEditor({ db: _db, auth: _auth, container: _container }) {
  db = _db;
  auth = _auth;
  container = _container;

  renderUI();
  bindEvents();

  // default load example site
  await loadProperty("carmarthen-demo");
}

// ======================================
// UI
// ======================================
function renderUI() {
  container.innerHTML = `
    <div class="page-header">
      <h1>Property Editor</h1>
      <p>Edit holiday site content stored in Firestore</p>
    </div>

    <div class="field">
      <label>Property ID</label>
      <input id="propertyIdInput" value="carmarthen-demo">
      <button id="loadPropertyBtn" class="btn btn-secondary" style="margin-top:10px;">
        Load Property
      </button>
    </div>

    <hr>

    <div id="editorArea"></div>

    <button id="savePropertyBtn" class="btn btn-primary" style="margin-top:20px;">
      Save Changes
    </button>

    <pre id="rawPreview" style="margin-top:20px;background:#111;padding:10px;color:#0f0;"></pre>
  `;
}

// ======================================
// LOAD
// ======================================
async function loadProperty(id) {
  currentPropertyId = id;

  const doc = await db.collection("properties").doc(id).get();

  if (!doc.exists) {
    alert("Property not found — creating new empty one");
  }

  const data = doc.exists ? doc.data() : getEmptyTemplate();

  renderEditor(data);
}

// ======================================
// DEFAULT TEMPLATE
// ======================================
function getEmptyTemplate() {
  return {
    seo: {},
    hero: {},
    details: {},
    welcome: {},
    about: {},
    experience: {},
    features: [],
    park: {},
    gallery: {},
    reviews: {},
    pricing: {},
    booking: {},
    location: {},
    contact: {},
    footer: {}
  };
}

// ======================================
// EDITOR RENDER
// ======================================
function renderEditor(data) {
  const editor = document.getElementById("editorArea");
  const preview = document.getElementById("rawPreview");

  editor.innerHTML = `
    <h3>Hero</h3>
    <input id="heroTitle" placeholder="Hero Title" value="${data.hero?.title || ""}">
    <input id="heroSubtitle" placeholder="Hero Subtitle" value="${data.hero?.subtitle || ""}">

    <h3>Pricing (Low Season)</h3>
    <input id="lowPrice" placeholder="£295" value="${data.pricing?.seasons?.[0]?.from || ""}">
  `;

  preview.textContent = JSON.stringify(data, null, 2);
}

// ======================================
// SAVE
// ======================================
async function saveProperty() {
  const updated = {
    hero: {
      title: document.getElementById("heroTitle").value,
      subtitle: document.getElementById("heroSubtitle").value
    },
    pricing: {
      seasons: [
        {
          title: "Low Season",
          from: document.getElementById("lowPrice").value
        }
      ]
    },
    updatedAt: new Date()
  };

  await db.collection("properties")
    .doc(currentPropertyId)
    .set(updated, { merge: true });

  alert("Saved to Firestore");
}

// ======================================
// EVENTS
// ======================================
function bindEvents() {

  document.addEventListener("click", async (e) => {

    if (e.target.id === "loadPropertyBtn") {
      const id = document.getElementById("propertyIdInput").value;
      await loadProperty(id);
    }

    if (e.target.id === "savePropertyBtn") {
      await saveProperty();
    }

  });

                                                     }
