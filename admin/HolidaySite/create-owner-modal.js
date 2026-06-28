let db = null;

// Allow main system to pass Firestore into this module
export function setOwnerModalDB(firestore) {
  db = firestore;
}

let currentPropertyId = null;

export function initCreateOwnerModal() {
  if (document.getElementById("ownerModal")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div id="ownerModal" class="owner-modal">
      <div class="owner-modal-card">

        <h2>Create Owner Account</h2>
        <p>Create an owner account for this holiday property.</p>

        <div class="field">
          <label>Owner Name</label>
          <input id="ownerName" type="text" placeholder="John Smith">
        </div>

        <div class="field">
          <label>Domain</label>
          <input id="ownerDomain" type="text" disabled>
        </div>

        <div class="field">
          <label>Email</label>
          <input id="ownerEmail" type="email" placeholder="john@email.com">
        </div>

        <div class="field">
          <label>Temporary Password</label>
          <input id="ownerPassword" type="text" value="Holiday123!">
        </div>

        <div class="modal-buttons">
          <button id="cancelOwnerBtn" class="btn btn-secondary">Cancel</button>
          <button id="createOwnerBtn" class="btn btn-primary">Create Owner</button>
        </div>

      </div>
    </div>
  `);

  document.getElementById("cancelOwnerBtn").onclick = closeOwnerModal;
}

export async function openOwnerModal(propertyId) {
  currentPropertyId = propertyId;

  // Load property from Firestore
  const snap = await db.collection("properties").doc(propertyId).get();
  const p = snap.data();

  // Fill domain field
  document.getElementById("ownerDomain").value =
    p.siteDomain || "No domain set";

  document.getElementById("ownerModal").style.display = "flex";
}

export function closeOwnerModal() {
  document.getElementById("ownerModal").style.display = "none";
}

export function getCurrentPropertyId() {
  return currentPropertyId;
}
