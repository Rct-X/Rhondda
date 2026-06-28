import {
  initCreateOwnerModal,
  openOwnerModal,
  closeOwnerModal,
  getCurrentPropertyId
} from "./create-owner-modal.js";

let db;
let container;

export function initOwnerSystem({ db: firestore, container: el }) {
  console.log("🟦 initOwnerSystem() START");

  db = firestore;
  container = el;

  initCreateOwnerModal();
  bindEvents();
  loadProperties();

  console.log("🟩 initOwnerSystem() COMPLETE");
}

// ===============================
// LOAD PROPERTIES
// ===============================
async function loadProperties() {
  console.log("📥 loadProperties() START");

  container.innerHTML = `
    <div class="page-header">
      <h1>Owners</h1>
      <p>Assign owners to holiday properties.</p>
    </div>

    <div id="ownersList">Loading...</div>
  `;

  const wrap = document.getElementById("ownersList");

  const snap = await db.collection("properties").get();
  console.log(`📄 Loaded ${snap.size} properties`);

  wrap.innerHTML = "";

  snap.forEach(doc => {
    const p = doc.data();

    console.log(`➡️ Rendering property: ${doc.id} (${p.hero?.title || "Untitled"})`);

    wrap.innerHTML += `
      <div class="owner-card">
        <h2>${p.hero?.title || "Untitled"}</h2>

        <p><strong>Owner:</strong> ${p.ownerEmail || "Not assigned"}</p>

        <button class="btn btn-primary assign-owner-btn"
                data-id="${doc.id}">
          ${p.ownerId ? "Change Owner" : "Create Owner"}
        </button>
      </div>
    `;
  });

  console.log("📤 loadProperties() COMPLETE");
}

// ===============================
// EVENTS
// ===============================
function bindEvents() {
  console.log("🟦 bindEvents() SETUP");

  container.addEventListener("click", async (e) => {

    const assignBtn = e.target.closest(".assign-owner-btn");
    if (assignBtn) {
      console.log(`🟩 assign-owner-btn CLICKED for property: ${assignBtn.dataset.id}`);
      openOwnerModal(assignBtn.dataset.id);
      return;
    }

    if (e.target.id === "cancelOwnerBtn") {
      console.log("❌ cancelOwnerBtn CLICKED");
      closeOwnerModal();
      return;
    }

    if (e.target.id === "createOwnerBtn") {
      console.log("🟧 createOwnerBtn CLICKED");
      await createOwner();
      return;
    }

  });

  console.log("🟩 bindEvents() COMPLETE");
}

// ===============================
// CREATE OWNER
// ===============================
async function createOwner() {
  console.log("🔥 createOwner() START");

  const propertyId = getCurrentPropertyId();
  const name = document.getElementById("ownerName").value.trim();
  const email = document.getElementById("ownerEmail").value.trim();
  const password = document.getElementById("ownerPassword").value.trim();

  console.log("📌 Form Data:", { propertyId, name, email });

  if (!propertyId || !email || !password) {
    console.warn("⚠️ Missing required fields");
    alert("Missing required fields");
    return;
  }

  try {
    console.log("📤 Sending request to Netlify function…");

    const res = await fetch("/.netlify/functions/create-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, name, email, password })
    });

    console.log("📥 Response received:", res.status);

    const data = await res.json();
    console.log("📄 Response JSON:", data);

    if (!data.ok) {
      console.error("❌ Owner creation failed:", data.error);
      alert(data.error || "Failed to create owner");
      return;
    }

    console.log("🟩 Owner created successfully");

    closeOwnerModal();

    console.log("🔄 Reloading properties…");
    await loadProperties();

    console.log("🟩 createOwner() COMPLETE");

  } catch (err) {
    console.error("🔥 ERROR in createOwner():", err);
    alert("Server error creating owner");
  }
}
