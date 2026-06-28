let db;
let auth;
let currentId = null;

// ======================================
// INIT
// ======================================
export function initPropertyJsonEditor({ db: _db, auth: _auth, container }) {
  db = _db;
  auth = _auth;

  container.innerHTML = `
    <div class="page-header">
      <h1>Property JSON Editor</h1>
      <p>Paste full property data or load existing site</p>
    </div>

    <div class="field">
      <label>Property ID</label>
      <input id="propertyId" placeholder="carmarthen-demo">
      <button id="loadBtn" class="btn btn-secondary" style="margin-top:10px;">
        Load
      </button>
    </div>

    <hr>

    <div class="field">
      <label>Property JSON</label>
      <textarea id="jsonInput" rows="25" style="width:100%; font-family: monospace;"></textarea>
    </div>

    <button id="saveBtn" class="btn btn-primary">
      Save to Firestore
    </button>

    <button id="newBtn" class="btn btn-secondary">
      New Empty Template
    </button>

    <pre id="status" style="margin-top:20px;"></pre>
  `;

  bindEvents();
}

// ======================================
// EVENTS
// ======================================
function bindEvents() {

  document.addEventListener("click", async (e) => {

    if (e.target.id === "loadBtn") {
      await loadProperty();
    }

    if (e.target.id === "saveBtn") {
      await saveProperty();
    }

    if (e.target.id === "newBtn") {
      createEmpty();
    }

  });

}

// ======================================
// LOAD FROM FIRESTORE
// ======================================
async function loadProperty() {

  const id = document.getElementById("propertyId").value.trim();
  if (!id) return;

  currentId = id;

  const doc = await db.collection("properties").doc(id).get();

  if (!doc.exists) {
    alert("Property not found");
    return;
  }

  document.getElementById("jsonInput").value =
    JSON.stringify(doc.data(), null, 2);

  document.getElementById("status").textContent =
    "Loaded: " + id;
}

// ======================================
// SAVE TO FIRESTORE
// ======================================
async function saveProperty() {

  const id = document.getElementById("propertyId").value.trim();
  const raw = document.getElementById("jsonInput").value;

  if (!id) return alert("Missing ID");

  let data;

  try {
    data = JSON.parse(raw);
  } catch (err) {
    alert("Invalid JSON");
    return;
  }

  await db.collection("properties")
    .doc(id)
    .set(data, { merge: true });

  document.getElementById("status").textContent =
    "Saved to Firestore: " + id;
}

// ======================================
// CREATE EMPTY TEMPLATE
// ======================================
function createEmpty() {

  const template = {
    seo: {
      title: "",
      description: "",
      keywords: ""
    },
    hero: {
      title: "",
      subtitle: "",
      image: "",
      button: ""
    },
    details: {
      park: "",
      town: "",
      postcode: "",
      sleeps: ""
    },
    welcome: {},
    about: {},
    experience: {},
    features: [],
    park: {},
    gallery: { images: [] },
    reviews: { items: [] },
    pricing: { seasons: [] },
    booking: {},
    location: {},
    contact: {},
    footer: {}
  };

  document.getElementById("jsonInput").value =
    JSON.stringify(template, null, 2);
              }
