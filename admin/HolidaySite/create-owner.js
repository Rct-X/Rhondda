import {
  initCreateOwnerModal,
  openOwnerModal,
  closeOwnerModal,
  getCurrentPropertyId
} from "./create-owner-modal.js";

let db;
let container;

export function initOwnerSystem({ db: firestore, container: el }) {
  db = firestore;
  container = el;

  initCreateOwnerModal();
  bindEvents();
  loadProperties();
}

// ===============================
// CREATE OWNER
// ===============================
async function createOwner() {
  console.log("🔥 createOwner FUNCTION STARTED");

  const propertyId = getCurrentPropertyId();
  const name = document.getElementById("ownerName").value.trim();
  const email = document.getElementById("ownerEmail").value.trim();
  const password = document.getElementById("ownerPassword").value.trim();

  if (!propertyId || !email || !password) {
    alert("Missing required fields");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/create-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, name, email, password })
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || "Failed to create owner");
      return;
    }

    closeOwnerModal();
    await loadProperties();

  } catch (err) {
    console.error(err);
    alert("Server error creating owner");
  }
}

// ===============================
// LOAD PROPERTIES
// ===============================
async function loadProperties() {
  container.innerHTML = `
    <div class="page-header">
      <h1>Owners</h1>
      <p>Assign owners to holiday properties.</p>
    </div>

    <div id="ownersList">Loading...</div>
  `;

  const wrap = document.getElementById("ownersList");

  const snap = await db.collection("properties").get();
  wrap.innerHTML = "";

  snap.forEach(doc => {
    const p = doc.data();

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
}

// ===============================
// EVENTS
// ===============================
function bindEvents() {

  container.addEventListener("click", async (e) => {

    const assignBtn = e.target.closest(".assign-owner-btn");
    if (assignBtn) {
      openOwnerModal(assignBtn.dataset.id);
      return;
    }

    if (e.target.id === "cancelOwnerBtn") {
      closeOwnerModal();
      return;
    }

    if (e.target.id === "createOwnerBtn") {
      await createOwner();
      return;
    }

  });
}

// ===============================
// CREATE OWNER
// ===============================
async function createOwner() {

  const propertyId = getCurrentPropertyId();

  const name = document.getElementById("ownerName").value.trim();
  const email = document.getElementById("ownerEmail").value.trim();
  const password = document.getElementById("ownerPassword").value.trim();

  if (!propertyId || !email || !password) {
    alert("Missing required fields");
    return;
  }

  try {

    const res = await fetch("/.netlify/functions/create-owner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId, name, email, password })
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || "Failed to create owner");
      return;
    }

    closeOwnerModal();

    await loadProperties(); // NO reload

  } catch (err) {
    console.error(err);
    alert("Server error creating owner");
  }
}
