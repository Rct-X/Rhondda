// ======================================
// MODERATION.JS
// Optimised moderation module
// Lower Firestore reads version
// ======================================

let db;
let auth;

// ======================================
// INIT
// ======================================

export async function initModeration(services) {

  console.log("[MODERATION] Initialising moderation module");
  console.log("[MODERATION] DOM CHECK", {
  pendingList: document.getElementById("pendingList"),
  claimsList: document.getElementById("claimsList"),
  changesList: document.getElementById("pendingChangesList")
});

  try {

    db = services.db;
    auth = services.auth;

    console.log("[MODERATION] Services assigned", {
      db: !!db,
      auth: !!auth
    });

    // Global access for onclick handlers
    window.approveBusiness = approveBusiness;
    window.rejectBusiness = rejectBusiness;

    window.approveClaim = approveClaim;
    window.rejectClaim = rejectClaim;

    window.approvePendingChanges = approvePendingChanges;
    window.rejectPendingChanges = rejectPendingChanges;

    console.log("[MODERATION] Starting data loads");

    await Promise.all([
      loadDashboardStats().catch(e => console.error("dashboard failed", e)),
      loadPending().catch(e => console.error("pending failed", e)),
      loadClaims().catch(e => console.error("claims failed", e)),
      loadPendingChanges().catch(e => console.error("changes failed", e))
    ]);

    console.log("[MODERATION] All loads complete");

  } catch (err) {
    console.error("[MODERATION] INIT FAILED:", err);
  }
}

// ======================================
// DASHBOARD STATS
// ======================================

async function loadDashboardStats() {

  try {

    const res = await fetch("/.netlify/functions/getDashboardStats");
    const data = await res.json();

    document.getElementById("totalBusinesses").textContent = data.totalBusinesses || 0;
    document.getElementById("pendingCount").textContent = data.pendingSubmissions || 0;
    document.getElementById("claimedCount").textContent = data.pendingClaims || 0;
    document.getElementById("townCount").textContent = data.townCount || 0;

  } catch (err) {
    console.error("[DASHBOARD] Stats failed:", err);
  }
}

// ======================================
// LOAD PENDING SUBMISSIONS
// ======================================

async function loadPending() {

  const list = document.getElementById("pendingList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading submissions...</p>`;

  try {

    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .limit(25)
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending submissions.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const b = doc.data();
      const id = doc.id;

      const item = document.createElement("div");
      item.className = "pending-item";
      item.dataset.pendingId = id;

      item.innerHTML = `
        <h3>${b.name || "Unnamed Business"}</h3>

        <p><strong>Category:</strong> ${b.category || "N/A"}</p>
        <p><strong>Town:</strong> ${b.town || "N/A"}</p>

        <p><strong>Phone:</strong> ${b.phone || "N/A"}</p>

        <p><strong>Website:</strong>
          ${b.website ? `<a href="${b.website}" target="_blank">${b.website}</a>` : "N/A"}
        </p>

        <p><strong>Address:</strong> ${b.address || "N/A"}</p>

        <p><strong>Description:</strong><br>${b.description || "N/A"}</p>

        ${b.createdAt ? `
          <p><strong>Submitted:</strong>
          ${new Date(b.createdAt.seconds * 1000).toLocaleString()}</p>
        ` : ""}

        <div class="pending-actions">
          <button class="btn btn-success" onclick="approveBusiness('${id}')">Approve</button>
          <button class="btn btn-danger" onclick="rejectBusiness('${id}')">Reject</button>
        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {
    console.error("[PENDING] Failed:", err);
    list.innerHTML = `<p>Error loading submissions.</p>`;
  }
}

// ======================================
// LOAD CLAIMS
// ======================================

async function loadClaims() {

  const list = document.getElementById("claimsList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading claims...</p>`;

  try {

    const snap = await db
      .collection("claims")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .limit(25)
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending claims.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const c = doc.data();
      const id = doc.id;

      const item = document.createElement("div");
      item.className = "pending-item";
      item.dataset.claimId = id;

      item.innerHTML = `
        <h3>Claim for: ${c.slug || "Unknown"}</h3>

        <p><strong>Name:</strong> ${c.name || "N/A"}</p>
        <p><strong>Email:</strong> ${c.email || "N/A"}</p>

        <p><strong>Message:</strong><br>${c.message || "No message"}</p>

        <div class="pending-actions">
          <button class="btn btn-success" onclick="approveClaim('${id}')">Approve Claim</button>
          <button class="btn btn-danger" onclick="rejectClaim('${id}')">Reject Claim</button>
        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {
    console.error("[CLAIMS] Failed:", err);
    list.innerHTML = `<p>Error loading claims.</p>`;
  }
}

// ======================================
// LOAD PENDING OWNER CHANGES
// ======================================

async function loadPendingChanges() {

  const list = document.getElementById("pendingChangesList");
  if (!list || !db) return;

  list.innerHTML = `<p>Loading owner edits...</p>`;

  try {

    const snap = await db
      .collection("pending_changes")
      .orderBy("submittedAt", "desc")
      .limit(25)
      .get();

    if (snap.empty) {
      list.innerHTML = `<p>No pending owner edits.</p>`;
      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const data = doc.data();
      const id = doc.id;

      const item = document.createElement("div");
      item.className = "pending-item";
      item.dataset.changeId = id;

      item.innerHTML = `
        <h3>Pending Changes</h3>

        <p><strong>Business ID:</strong> ${data.businessId || id}</p>
        <p><strong>Owner:</strong> ${data.ownerId || "Unknown"}</p>
        <p><strong>Status:</strong> ${data.status || "Pending"}</p>

        ${data.submittedAt ? `
          <p><strong>Submitted:</strong>
          ${new Date(data.submittedAt.seconds * 1000).toLocaleString()}</p>
        ` : ""}

        <details>
          <summary>View Data</summary>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        </details>

        <div class="pending-actions">
          <button class="btn btn-success" onclick="approvePendingChanges('${id}')">Approve</button>
          <button class="btn btn-danger" onclick="rejectPendingChanges('${id}')">Reject</button>
        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {
    console.error("[PENDING_CHANGES] Failed:", err);
    list.innerHTML = `<p>Error loading owner edits.</p>`;
  }
}

// ======================================
// APPROVAL HELPERS (FIXED TOKEN HANDLING)
// ======================================

async function getToken() {
  const user = auth?.currentUser;
  if (!user) throw new Error("No authenticated user");
  return await user.getIdToken();
}

// ======================================
// BUSINESS ACTIONS
// ======================================

async function approveBusiness(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/approveBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Approve request failed");

    document.querySelector(`[data-pending-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to approve business");
  }
}

async function rejectBusiness(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/rejectBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Reject request failed");

    document.querySelector(`[data-pending-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to reject business");
  }
}

// ======================================
// CLAIM ACTIONS
// ======================================

async function approveClaim(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/approveClaim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ claimId: id })
    });

    if (!res.ok) throw new Error("Approve claim failed");

    document.querySelector(`[data-claim-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to approve claim");
  }
}

async function rejectClaim(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/rejectClaim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ claimId: id })
    });

    if (!res.ok) throw new Error("Reject claim failed");

    document.querySelector(`[data-claim-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to reject claim");
  }
}

// ======================================
// OWNER CHANGE ACTIONS
// ======================================

async function approvePendingChanges(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/approvePendingChanges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ businessId: id })
    });

    if (!res.ok) throw new Error("Approve changes failed");

    document.querySelector(`[data-change-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to approve changes");
  }
}

async function rejectPendingChanges(id) {

  try {

    const token = await getToken();

    const res = await fetch("/.netlify/functions/rejectPendingChanges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ id })
    });

    if (!res.ok) throw new Error("Reject changes failed");

    document.querySelector(`[data-change-id="${id}"]`)?.remove();

  } catch (err) {
    console.error(err);
    alert("Failed to reject changes");
  }
}
