// ======================================
// MODERATION MODULE (FULLY MODULAR)
// ======================================

let db;
let auth;
let container;

// ======================================
// PUBLIC INIT
// ======================================

export async function initModeration({ db: _db, auth: _auth, container: _container }) {
  console.log("[MODERATION] Initialising moderation module");

  db = _db;
  auth = _auth;
  container = _container;

  bindEventDelegation();

  await Promise.all([
    loadPending(),
    loadClaims(),
    loadPendingChanges()
  ]);
}

// ======================================
// EVENT DELEGATION (NO WINDOW GLOBALS)
// ======================================

function bindEventDelegation() {
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;

    const actions = {
      "approve-business": () => approveBusiness(id),
      "reject-business": () => rejectBusiness(id),
      "approve-claim": () => approveClaim(id),
      "reject-claim": () => rejectClaim(id),
      "approve-changes": () => approvePendingChanges(id),
      "reject-changes": () => rejectPendingChanges(id)
    };

    if (actions[action]) actions[action]();
  });
}

// ======================================
// LOAD PENDING SUBMISSIONS
// ======================================

async function loadPending() {
  const list = container.querySelector("#pendingList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading submissions...</p>`;

  try {
    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending submissions.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {
      const b = doc.data();
      const id = doc.id;

      list.appendChild(renderPendingBusiness(b, id));
    });

  } catch (err) {
    console.error("[PENDING] Failed:", err);
    list.innerHTML = `<p>Error loading submissions.</p>`;
  }
}

function renderPendingBusiness(b, id) {
  const div = document.createElement("div");
  div.className = "pending-item";

  div.innerHTML = `
    <div class="pending-top">
      <div>
        <h3>${b.name || "Unnamed Business"}</h3>
        <div class="pending-meta">
          <span>${b.category || "No category"}</span>
          <span>${b.town || "No town"}</span>
        </div>
      </div>
    </div>

    <div class="pending-content">
      <p><strong>Phone:</strong> ${b.phone || "N/A"}</p>
      <p><strong>Website:</strong> ${
        b.website
          ? `<a href="${b.website}" target="_blank" rel="noopener noreferrer">${b.website}</a>`
          : "N/A"
      }</p>
      <p><strong>Address:</strong> ${b.address || "N/A"}</p>
      <p><strong>Description:</strong><br>${b.description || "N/A"}</p>

      ${b.wasteLicence ? `<p><strong>Waste Licence:</strong> ${b.wasteLicence}</p>` : ""}
      ${b.keywords?.length ? `<p><strong>Keywords:</strong> ${b.keywords.join(", ")}</p>` : ""}

      ${
        b.createdAt
          ? `<p class="pending-date">Submitted: ${new Date(b.createdAt.seconds * 1000).toLocaleString()}</p>`
          : ""
      }
    </div>

    <div class="pending-actions">
      <button class="btn btn-success" data-action="approve-business" data-id="${id}">Approve</button>
      <button class="btn btn-danger" data-action="reject-business" data-id="${id}">Reject</button>
    </div>
  `;

  return div;
}

// ======================================
// LOAD CLAIMS
// ======================================

async function loadClaims() {
  const list = container.querySelector("#claimsList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading claims...</p>`;

  try {
    const snap = await db
      .collection("claims")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending claims.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {
      const c = doc.data();
      const id = doc.id;

      list.appendChild(renderClaim(c, id));
    });

  } catch (err) {
    console.error("[CLAIMS] Failed:", err);
    list.innerHTML = `<p>Error loading claims.</p>`;
  }
}

function renderClaim(c, id) {
  const div = document.createElement("div");
  div.className = "pending-item";

  div.innerHTML = `
    <h3>Claim for: ${c.slug || "Unknown"}</h3>

    <p><strong>Name:</strong> ${c.name || "N/A"}</p>
    <p><strong>Email:</strong> ${c.email || "N/A"}</p>
    <p><strong>Message:</strong><br>${c.message || "No message"}</p>

    <div class="pending-actions">
      <button class="btn btn-success" data-action="approve-claim" data-id="${id}">Approve Claim</button>
      <button class="btn btn-danger" data-action="reject-claim" data-id="${id}">Reject Claim</button>
    </div>
  `;

  return div;
}

// ======================================
// LOAD PENDING OWNER CHANGES
// ======================================

async function loadPendingChanges() {
  const list = container.querySelector("#pendingChangesList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading owner edits...</p>`;

  try {
    const snap = await db
      .collection("pending_changes")
      .orderBy("submittedAt", "desc")
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending owner edits.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {
      const data = doc.data();
      const id = doc.id;

      list.appendChild(renderPendingChange(data, id));
    });

  } catch (err) {
    console.error("[PENDING_CHANGES] Failed:", err);
    list.innerHTML = `<p>Error loading owner edits.</p>`;
  }
}

function renderPendingChange(data, id) {
  const div = document.createElement("div");
  div.className = "pending-item";

  div.innerHTML = `
    <h3>Pending Changes</h3>

    <p><strong>Business ID:</strong> ${data.businessId || id}</p>
    <p><strong>Owner:</strong> ${data.ownerId || "Unknown"}</p>
    <p><strong>Status:</strong> ${data.status || "Pending"}</p>

    ${
      data.submittedAt
        ? `<p class="pending-date">Submitted: ${new Date(data.submittedAt.seconds * 1000).toLocaleString()}</p>`
        : ""
    }

    <details class="pending-json">
      <summary>View Submitted Data</summary>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </details>

    <div class="pending-actions">
      <button class="btn btn-success" data-action="approve-changes" data-id="${id}">Approve</button>
      <button class="btn btn-danger" data-action="reject-changes" data-id="${id}">Reject</button>
    </div>
  `;

  return div;
}

// ======================================
// ACTIONS (NO GLOBALS)
// ======================================

async function approveBusiness(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/approveBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Approve request failed");

    await loadPending();

  } catch (err) {
    console.error(err);
    alert("Failed to approve business");
  }
}

async function rejectBusiness(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/rejectBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Reject request failed");

    await loadPending();

  } catch (err) {
    console.error(err);
    alert("Failed to reject business");
  }
}

async function approveClaim(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/approveClaim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ claimId: id })
    });

    if (!res.ok) throw new Error("Approve claim failed");

    await loadClaims();

  } catch (err) {
    console.error(err);
    alert("Failed to approve claim");
  }
}

async function rejectClaim(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/rejectClaim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ claimId: id })
    });

    if (!res.ok) throw new Error("Reject claim failed");

    await loadClaims();

  } catch (err) {
    console.error(err);
    alert("Failed to reject claim");
  }
}

async function approvePendingChanges(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/approvePendingChanges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ businessId: id })
    });

    if (!res.ok) throw new Error("Approve changes failed");

    await loadPendingChanges();

  } catch (err) {
    console.error(err);
    alert("Failed to approve changes");
  }
}

async function rejectPendingChanges(id) {
  try {
    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/rejectPendingChanges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Reject changes failed");

    await loadPendingChanges();

  } catch (err) {
    console.error(err);
    alert("Failed to reject changes");
  }
      }
