// ===============================
// ICON MAPPING FOR FEATURES
// ===============================
const FEATURE_ICONS = {
  "Sleeps 6": "family",
  "Sleeps 5": "family",
  "Sleeps 4": "family",
  "Sleeps 2": "family",
  "3 Bedrooms": "bed",
  "2 Bedrooms": "bed",
  "1 Bedroom": "bed",
  "Free Wi-Fi": "wifi",
  "Wi-Fi": "wifi",
  "Wifi": "wifi",
  "Tv": "tv"
};

function processFeatures(list) {
  return list
    .map(f => f.trim())
    .filter(f => f.length > 0)
    .map(f => {
      const icon = FEATURE_ICONS[f];
      return icon ? { text: f, icon } : f;
    });
}

// ===============================
// MODULE STATE
// ===============================
let db;
let auth;
let container;

// ===============================
// INIT ENTRY POINT
// ===============================
export function initPropertyCreator({ db: _db, auth: _auth, container: el }) {
  db = _db;
  auth = _auth;
  container = el;

  renderShell();
  bindEvents();
}

// ===============================
// RENDER BASE UI
// ===============================
function renderShell() {
  container.innerHTML = `
    <div class="page-header">
      <h1>Create New Property</h1>
      <p>Fill in the fields below to create a new holiday property.</p>
    </div>

    <div class="field">
      <label>New Property ID</label>
      <input id="newPropId" placeholder="e.g. seaside-lodge">
      <button id="createPropBtn" class="btn btn-primary">Create Property</button>
    </div>

    <hr>

    <div id="propFormWrap" style="display:none;">

      <h2>Hero</h2>
      <div class="field"><label>Hero Title</label><input id="heroTitle"></div>
      <div class="field"><label>Hero Subtitle</label><input id="heroSubtitle"></div>
      <div class="field"><label>Hero Image URL</label><input id="heroImage"></div>
      <div class="field"><label>Hero Button Text</label><input id="heroButton"></div>

      <h2>Details</h2>
      <div class="field"><label>Park Name</label><input id="detailsPark"></div>
      <div class="field"><label>Property Type</label><input id="detailsType"></div>
      <div class="field"><label>Bedrooms</label><input id="detailsBedrooms" type="number"></div>
      <div class="field"><label>Sleeps</label><input id="detailsSleeps" type="number"></div>
      <div class="field"><label>Town</label><input id="detailsTown"></div>
      <div class="field"><label>Postcode</label><input id="detailsPostcode"></div>

      <h2>Gallery</h2>
      <div class="field"><label>Gallery Title</label><input id="galleryTitle"></div>
      <div class="field"><label>Gallery Description</label><input id="galleryDescription"></div>
      <div class="field"><label>Gallery Hint</label><input id="galleryHint"></div>
      <div class="field"><label>Gallery Images (one per line)</label><textarea id="galleryImages" rows="5"></textarea></div>

      <h2>Features</h2>
      <div class="field"><label>Features (one per line)</label><textarea id="featuresInput" rows="6"></textarea></div>

      <h2>About</h2>
      <div class="field"><label>About Title</label><input id="aboutTitle"></div>
      <div class="field"><label>About Text</label><textarea id="aboutText" rows="4"></textarea></div>

      <h2>Park Facilities</h2>
      <div class="field"><label>Park Title</label><input id="parkTitle"></div>
      <div class="field"><label>Facilities (one per line)</label><textarea id="parkFacilities" rows="5"></textarea></div>

      <h2>Location</h2>
      <div class="field"><label>Location Title</label><input id="locationTitle"></div>
      <div class="field"><label>Location Text</label><textarea id="locationText" rows="3"></textarea></div>
      <div class="field"><label>Location Postcode</label><input id="locationPostcode"></div>
      <div class="field"><label>Google Map Query</label><input id="locationMapQuery"></div>

      <h2>Welcome</h2>
      <div class="field"><label>Welcome Tag</label><input id="welcomeTag"></div>
      <div class="field"><label>Welcome Lead</label><textarea id="welcomeLead" rows="3"></textarea></div>
      <div class="field"><label>Welcome Title</label><input id="welcomeTitle"></div>

      <h2>Experience</h2>
      <div class="field"><label>Experience Title</label><input id="expTitle"></div>
      <div class="field"><label>Experience Text</label><textarea id="expText" rows="3"></textarea></div>
      <div class="field"><label>Experience Tag</label><input id="expTag"></div>
      <div class="field"><label>Experience Button</label><input id="expButton"></div>

      <h2>Contact</h2>
      <div class="field"><label>Contact Title</label><input id="contactTitle"></div>
      <div class="field"><label>Contact Button Text</label><input id="contactButton"></div>
      <div class="field"><label>Contact Phone</label><input id="contactPhone"></div>
      <div class="field"><label>Contact Email</label><input id="contactEmail"></div>
      <div class="field"><label>Contact WhatsApp</label><input id="contactWhatsapp"></div>
      <div class="field"><label>Contact Description</label><textarea id="contactDescription" rows="3"></textarea></div>

      <h2>SEO</h2>
      <div class="field"><label>SEO Title</label><input id="seoTitle"></div>
      <div class="field"><label>SEO Description</label><textarea id="seoDescription" rows="3"></textarea></div>
      <div class="field"><label>SEO Keywords</label><input id="seoKeywords"></div>

      <h2>Footer</h2>
      <div class="field"><label>Footer Copyright</label><input id="footerCopyright"></div>

      <h2>Site & Owner</h2>
      <div class="field"><label>Site Domain</label><input id="siteDomain"></div>
      <div class="field"><label>Owner Name</label><input id="ownerName"></div>
      <div class="field"><label>Owner Email</label><input id="ownerEmail"></div>

      <div class="actions">
        <button id="saveNewPropBtn" class="btn btn-primary">Save New Property</button>
        <pre id="propStatus"></pre>
      </div>

    </div>
  `;
}

// ===============================
// EVENTS
// ===============================
function bindEvents() {
  document.addEventListener("click", async (e) => {
    if (e.target.id === "createPropBtn") {
      showForm();
    }
    if (e.target.id === "saveNewPropBtn") {
      await handleCreate();
    }
  });
}

// ===============================
// SHOW BLANK FORM
// ===============================
function showForm() {
  const id = document.getElementById("newPropId").value.trim();
  if (!id) return alert("Enter a property ID");

  document.getElementById("propFormWrap").style.display = "block";
}

// ===============================
// CREATE NEW PROPERTY
// ===============================
async function handleCreate() {
  const id = document.getElementById("newPropId").value.trim();
  if (!id) return alert("Enter a property ID");

  const galleryImages = document.getElementById("galleryImages").value
    .split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const featureLines = document.getElementById("featuresInput").value
    .split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const parkFacilities = document.getElementById("parkFacilities").value
    .split("\n").map(s => s.trim()).filter(s => s.length > 0);

  const data = {
    id,

    seo: {
      title: document.getElementById("seoTitle").value.trim(),
      description: document.getElementById("seoDescription").value.trim(),
      keywords: document.getElementById("seoKeywords").value.trim()
    },

    siteDomain: document.getElementById("siteDomain").value.trim(),
    ownerName: document.getElementById("ownerName").value.trim(),
    ownerEmail: document.getElementById("ownerEmail").value.trim(),

    booking: {
      seasons: []
    },

    updatedAt: new Date(),

    gallery: {
      title: document.getElementById("galleryTitle").value.trim(),
      description: document.getElementById("galleryDescription").value.trim(),
      hint: document.getElementById("galleryHint").value.trim(),
      images: galleryImages
    },

    about: {
      title: document.getElementById("aboutTitle").value.trim(),
      text: document.getElementById("aboutText").value.trim()
    },

    details: {
      park: document.getElementById("detailsPark").value.trim(),
      type: document.getElementById("detailsType").value.trim(),
      bedrooms: Number(document.getElementById("detailsBedrooms").value) || 0,
      sleeps: Number(document.getElementById("detailsSleeps").value) || 0,
      town: document.getElementById("detailsTown").value.trim(),
      postcode: document.getElementById("detailsPostcode").value.trim()
    },

    features: processFeatures(featureLines),

    park: {
      title: document.getElementById("parkTitle").value.trim(),
      facilities: parkFacilities
    },

    location: {
      title: document.getElementById("locationTitle").value.trim(),
      text: document.getElementById("locationText").value.trim(),
      postcode: document.getElementById("locationPostcode").value.trim(),
      googleMapQuery: document.getElementById("locationMapQuery").value.trim()
    },

    footer: {
      copyright: document.getElementById("footerCopyright").value.trim()
    },

    hero: {
      title: document.getElementById("heroTitle").value.trim(),
      subtitle: document.getElementById("heroSubtitle").value.trim(),
      image: document.getElementById("heroImage").value.trim(),
      button: document.getElementById("heroButton").value.trim()
    },

    experience: {
      title: document.getElementById("expTitle").value.trim(),
      text: document.getElementById("expText").value.trim(),
      tag: document.getElementById("expTag").value.trim(),
      button: document.getElementById("expButton").value.trim()
    },

    welcome: {
      tag: document.getElementById("welcomeTag").value.trim(),
      lead: document.getElementById("welcomeLead").value.trim(),
      title: document.getElementById("welcomeTitle").value.trim()
    },

    contact: {
      title: document.getElementById("contactTitle").value.trim(),
      button: document.getElementById("contactButton").value.trim(),
      phone: document.getElementById("contactPhone").value.trim(),
      email: document.getElementById("contactEmail").value.trim(),
      whatsapp: document.getElementById("contactWhatsapp").value.trim(),
      description: document.getElementById("contactDescription").value.trim()
    }
  };

  await db.collection("properties").doc(id).set(data);

  document.getElementById("propStatus").textContent = "New Property Created";
      }
