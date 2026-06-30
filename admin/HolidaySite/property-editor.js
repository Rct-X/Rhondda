// property-editor.js

import { ICONS } from "./icons.js"; // only if you want live icon preview (optional)

// ===============================
// ICON MAPPING FOR FEATURES
// ===============================
const FEATURE_ICONS = {
  "Sleeps 6": "family",
  "Sleeps 4": "family",
  "Sleeps 2": "family",
  "3 Bedrooms": "bed",
  "2 Bedrooms": "bed",
  "1 Bedroom": "bed",
  "Free Wi-Fi": "wifi",
  "Wi-Fi": "wifi",
  "Wifi": "wifi"
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
export function initPropertyEditor({ db: _db, auth: _auth, container: el }) {
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
      <h1>Property Editor</h1>
      <p>Load, edit, and save holiday properties.</p>
    </div>

    <div class="field">
      <label>Property ID</label>
      <input id="propIdInput" placeholder="e.g. carmarthen-demo">
      <button id="propLoadBtn" class="btn btn-secondary">Load Property</button>
    </div>

    <hr>

    <div id="propFormWrap" style="display:none;">

      <h2>Hero</h2>
      <div class="field">
        <label>Hero Title</label>
        <input id="heroTitle">
      </div>
      <div class="field">
        <label>Hero Subtitle</label>
        <input id="heroSubtitle">
      </div>
      <div class="field">
        <label>Hero Image URL</label>
        <input id="heroImage">
      </div>
      <div class="field">
        <label>Hero Button Text</label>
        <input id="heroButton">
      </div>

      <h2>Details</h2>
      <div class="field">
        <label>Park Name</label>
        <input id="detailsPark">
      </div>
      <div class="field">
        <label>Property Type</label>
        <input id="detailsType">
      </div>
      <div class="field">
        <label>Bedrooms</label>
        <input id="detailsBedrooms" type="number">
      </div>
      <div class="field">
        <label>Sleeps</label>
        <input id="detailsSleeps" type="number">
      </div>
      <div class="field">
        <label>Town</label>
        <input id="detailsTown">
      </div>
      <div class="field">
        <label>Postcode</label>
        <input id="detailsPostcode">
      </div>

      <h2>Gallery</h2>
      <div class="field">
        <label>Gallery Title</label>
        <input id="galleryTitle">
      </div>
      <div class="field">
        <label>Gallery Description</label>
        <input id="galleryDescription">
      </div>
      <div class="field">
        <label>Gallery Hint</label>
        <input id="galleryHint">
      </div>
      <div class="field">
        <label>Gallery Images (one per line)</label>
        <textarea id="galleryImages" rows="5"></textarea>
      </div>

      <h2>Features</h2>
      <div class="field">
        <label>Features (one per line)</label>
        <textarea id="featuresInput" rows="6"
          placeholder="Sleeps 6\n3 Bedrooms\nFree Wi-Fi\nSmart TV\nDog Friendly\nPrivate Parking\nOutdoor Seating Area"></textarea>
      </div>

      <h2>About</h2>
      <div class="field">
        <label>About Title</label>
        <input id="aboutTitle">
      </div>
      <div class="field">
        <label>About Text</label>
        <textarea id="aboutText" rows="4"></textarea>
      </div>

      <h2>Park Facilities</h2>
      <div class="field">
        <label>Park Title</label>
        <input id="parkTitle">
      </div>
      <div class="field">
        <label>Facilities (one per line)</label>
        <textarea id="parkFacilities" rows="5"></textarea>
      </div>

      <h2>Location</h2>
      <div class="field">
        <label>Location Title</label>
        <input id="locationTitle">
      </div>
      <div class="field">
        <label>Location Text</label>
        <textarea id="locationText" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Location Postcode</label>
        <input id="locationPostcode">
      </div>
      <div class="field">
        <label>Google Map Query</label>
        <input id="locationMapQuery">
      </div>

      <h2>Welcome</h2>
      <div class="field">
        <label>Welcome Tag</label>
        <input id="welcomeTag">
      </div>
      <div class="field">
        <label>Welcome Lead</label>
        <textarea id="welcomeLead" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Welcome Title</label>
        <input id="welcomeTitle">
      </div>

      <h2>Experience</h2>
      <div class="field">
        <label>Experience Title</label>
        <input id="expTitle">
      </div>
      <div class="field">
        <label>Experience Text</label>
        <textarea id="expText" rows="3"></textarea>
      </div>
      <div class="field">
        <label>Experience Tag</label>
        <input id="expTag">
      </div>
      <div class="field">
        <label>Experience Button</label>
        <input id="expButton">
      </div>

      <h2>Contact</h2>
      <div class="field">
        <label>Contact Title</label>
        <input id="contactTitle">
      </div>
      <div class="field">
        <label>Contact Button Text</label>
        <input id="contactButton">
      </div>
      <div class="field">
        <label>Contact Phone</label>
        <input id="contactPhone">
      </div>
      <div class="field">
        <label>Contact Email</label>
        <input id="contactEmail">
      </div>
      <div class="field">
        <label>Contact WhatsApp</label>
        <input id="contactWhatsapp">
      </div>
      <div class="field">
        <label>Contact Description</label>
        <textarea id="contactDescription" rows="3"></textarea>
      </div>

      <h2>SEO</h2>
      <div class="field">
        <label>SEO Title</label>
        <input id="seoTitle">
      </div>
      <div class="field">
        <label>SEO Description</label>
        <textarea id="seoDescription" rows="3"></textarea>
      </div>
      <div class="field">
        <label>SEO Keywords (comma separated)</label>
        <input id="seoKeywords">
      </div>

      <h2>Footer</h2>
      <div class="field">
        <label>Footer Copyright</label>
        <input id="footerCopyright">
      </div>

      <h2>Site & Owner</h2>
      <div class="field">
        <label>Site Domain</label>
        <input id="siteDomain">
      </div>
      <div class="field">
        <label>Owner Name</label>
        <input id="ownerName">
      </div>
      <div class="field">
        <label>Owner Email</label>
        <input id="ownerEmail">
      </div>

      <div class="actions">
        <button id="propSaveBtn" class="btn btn-primary">Save Property</button>
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
    if (e.target.id === "propLoadBtn") {
      await handleLoad();
    }
    if (e.target.id === "propSaveBtn") {
      await handleSave();
    }
  });
}

// ===============================
// LOAD PROPERTY
// ===============================
async function handleLoad() {
  const id = document.getElementById("propIdInput").value.trim();
  if (!id) return alert("Enter a property ID");

  const doc = await db.collection("properties").doc(id).get();
  if (!doc.exists) {
    return alert("Property not found");
  }

  const p = doc.data();

  document.getElementById("propFormWrap").style.display = "block";

  // Hero
  document.getElementById("heroTitle").value = p.hero?.title || "";
  document.getElementById("heroSubtitle").value = p.hero?.subtitle || "";
  document.getElementById("heroImage").value = p.hero?.image || "";
  document.getElementById("heroButton").value = p.hero?.button || "";

  // Details
  document.getElementById("detailsPark").value = p.details?.park || "";
  document.getElementById("detailsType").value = p.details?.type || "";
  document.getElementById("detailsBedrooms").value = p.details?.bedrooms ?? "";
  document.getElementById("detailsSleeps").value = p.details?.sleeps ?? "";
  document.getElementById("detailsTown").value = p.details?.town || "";
  document.getElementById("detailsPostcode").value = p.details?.postcode || "";

  // Gallery
  document.getElementById("galleryTitle").value = p.gallery?.title || "";
  document.getElementById("galleryDescription").value = p.gallery?.description || "";
  document.getElementById("galleryHint").value = p.gallery?.hint || "";
  document.getElementById("galleryImages").value =
    (p.gallery?.images || []).join("\n");

  // Features (flatten to text lines)
  const featureLines = (p.features || []).map(f =>
    typeof f === "string" ? f : f.text
  );
  document.getElementById("featuresInput").value = featureLines.join("\n");

  // About
  document.getElementById("aboutTitle").value = p.about?.title || "";
  document.getElementById("aboutText").value = p.about?.text || "";

  // Park
  document.getElementById("parkTitle").value = p.park?.title || "";
  document.getElementById("parkFacilities").value =
    (p.park?.facilities || []).join("\n");

  // Location
  document.getElementById("locationTitle").value = p.location?.title || "";
  document.getElementById("locationText").value = p.location?.text || "";
  document.getElementById("locationPostcode").value = p.location?.postcode || "";
  document.getElementById("locationMapQuery").value = p.location?.googleMapQuery || "";

  // Welcome
  document.getElementById("welcomeTag").value = p.welcome?.tag || "";
  document.getElementById("welcomeLead").value = p.welcome?.lead || "";
  document.getElementById("welcomeTitle").value = p.welcome?.title || "";

  // Experience
  document.getElementById("expTitle").value = p.experience?.title || "";
  document.getElementById("expText").value = p.experience?.text || "";
  document.getElementById("expTag").value = p.experience?.tag || "";
  document.getElementById("expButton").value = p.experience?.button || "";

  // Contact
  document.getElementById("contactTitle").value = p.contact?.title || "";
  document.getElementById("contactButton").value = p.contact?.button || "";
  document.getElementById("contactPhone").value = p.contact?.phone || "";
  document.getElementById("contactEmail").value = p.contact?.email || "";
  document.getElementById("contactWhatsapp").value = p.contact?.whatsapp || "";
  document.getElementById("contactDescription").value = p.contact?.description || "";

  // SEO
  document.getElementById("seoTitle").value = p.seo?.title || "";
  document.getElementById("seoDescription").value = p.seo?.description || "";
  document.getElementById("seoKeywords").value = p.seo?.keywords || "";

  // Footer
  document.getElementById("footerCopyright").value = p.footer?.copyright || "";

  // Site & Owner
  document.getElementById("siteDomain").value = p.siteDomain || "";
  document.getElementById("ownerName").value = p.ownerName || "";
  document.getElementById("ownerEmail").value = p.ownerEmail || "";

  document.getElementById("propStatus").textContent = "Loaded";
}

// ===============================
// SAVE PROPERTY
// ===============================
async function handleSave() {
  const id = document.getElementById("propIdInput").value.trim();
  if (!id) return alert("Enter a property ID");

  const galleryImages = document.getElementById("galleryImages").value
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const featureLines = document.getElementById("featuresInput").value
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const parkFacilities = document.getElementById("parkFacilities").value
    .split("\n")
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const data = {
    seo: {
      title: document.getElementById("seoTitle").value.trim(),
      description: document.getElementById("seoDescription").value.trim(),
      keywords: document.getElementById("seoKeywords").value.trim()
    },

    siteDomain: document.getElementById("siteDomain").value.trim(),
    ownerName: document.getElementById("ownerName").value.trim(),
    ownerEmail: document.getElementById("ownerEmail").value.trim(),

    booking: {
      seasons: [] // you can wire this later
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

    id,

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

  await db.collection("properties").doc(id).set(data, { merge: true });

  document.getElementById("propStatus").textContent = "Saved";
    }
