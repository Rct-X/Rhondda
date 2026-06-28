import {
  initCreateOwnerModal,
  openOwnerModal,
  closeOwnerModal,
  getCurrentPropertyId
} from "./create-owner-modal.js";

let db;

export function initOwnerSystem({ db: firestore, container }) {

  db = firestore;

  initCreateOwnerModal();

  bindEvents();

  loadProperties(container);

}

// ======================================
// LOAD PROPERTIES (UI LIST)
// ======================================

async function loadProperties(container) {

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

        <p>
          <strong>Owner:</strong>
          ${p.ownerEmail || "Not assigned"}
        </p>

        <button
          class="btn btn-primary assign-owner-btn"
          data-id="${doc.id}">

          ${p.ownerId ? "Change Owner" : "Create Owner"}

        </button>

      </div>
    `;

  });

}

// ======================================
// EVENTS
// ======================================

function bindEvents() {

  document.addEventListener("click", async (e) => {

    // OPEN MODAL
    if (e.target.classList.contains("assign-owner-btn")) {

      const propertyId = e.target.dataset.id;

      openOwnerModal(propertyId);

    }

    // CANCEL MODAL
    if (e.target.id === "cancelOwnerBtn") {
      closeOwnerModal();
    }

    // CREATE OWNER
    if (e.target.id === "createOwnerBtn") {

      await createOwner();

    }

  });

}

// ======================================
// CREATE OWNER (CORE LOGIC)
// ======================================

async function createOwner() {

  const propertyId = getCurrentPropertyId();

  const name =
    document.getElementById("ownerName").value.trim();

  const email =
    document.getElementById("ownerEmail").value.trim();

  const password =
    document.getElementById("ownerPassword").value.trim();

  if (!propertyId || !email || !password) {
    alert("Missing required fields");
    return;
  }

  try {

    const res = await fetch("/.netlify/functions/create-owner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        propertyId,
        name,
        email,
        password
      })
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || "Failed to create owner");
      return;
    }

    alert("Owner created successfully");

    closeOwnerModal();

    // refresh list
    location.reload();

  } catch (err) {

    console.error(err);
    alert("Server error creating owner");

  }

      }
