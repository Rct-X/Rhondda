// ======================================
// MODERATION.JS
// Lazy-loaded moderation module
// ======================================

let db;
let auth;

// ======================================
// INIT
// ======================================

export async function initModeration(services){

  console.log(
    "[MODERATION] Initialising moderation module"
  );

  db = services.db;
  auth = services.auth;

  // Global access for onclick handlers
  window.approveBusiness = approveBusiness;
  window.rejectBusiness = rejectBusiness;

  window.approveClaim = approveClaim;
  window.rejectClaim = rejectClaim;

  window.approvePendingChanges =
    approvePendingChanges;

  window.rejectPendingChanges =
    rejectPendingChanges;

  // Load all moderation data
  await Promise.all([
    loadPending(),
    loadClaims(),
    loadPendingChanges()
  ]);
}

// ======================================
// LOAD PENDING SUBMISSIONS
// ======================================

async function loadPending(){

  const list =
    document.getElementById("pendingList");

  if(!list || !db){
    return;
  }

  list.innerHTML = `
    <p>Loading submissions...</p>
  `;

  try{

    console.log(
      "[PENDING] Loading submissions"
    );

    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .get();

    console.log(
      "[PENDING] Found:",
      snap.size
    );

    if(snap.empty){

      list.innerHTML = `
        <p>No pending submissions.</p>
      `;

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const b = doc.data();
      const id = doc.id;

      const item =
        document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <div class="pending-top">

          <div>

            <h3>
              ${b.name || "Unnamed Business"}
            </h3>

            <div class="pending-meta">

              <span>
                ${b.category || "No category"}
              </span>

              <span>
                ${b.town || "No town"}
              </span>

            </div>

          </div>

        </div>

        <div class="pending-content">

          <p>
            <strong>Phone:</strong>
            ${b.phone || "N/A"}
          </p>

          <p>
            <strong>Website:</strong>

            ${
              b.website
                ? `
                  <a
                    href="${b.website}"
                    target="_blank"
                    rel="noopener noreferrer">
                    ${b.website}
                  </a>
                `
                : "N/A"
            }
          </p>

          <p>
            <strong>Address:</strong>
            ${b.address || "N/A"}
          </p>

          <p>
            <strong>Description:</strong><br>
            ${b.description || "N/A"}
          </p>

          ${
            b.wasteLicence
              ? `
                <p>
                  <strong>Waste Licence:</strong>
                  ${b.wasteLicence}
                </p>
              `
              : ""
          }

          ${
            b.keywords?.length
              ? `
                <p>
                  <strong>Keywords:</strong>
                  ${b.keywords.join(", ")}
                </p>
              `
              : ""
          }

          ${
            b.createdAt
              ? `
                <p class="pending-date">
                  Submitted:
                  ${new Date(
                    b.createdAt.seconds * 1000
                  ).toLocaleString()}
                </p>
              `
              : ""
          }

        </div>

        <div class="pending-actions">

          <button
            class="btn btn-success"
            onclick="approveBusiness('${id}')">

            Approve

          </button>

          <button
            class="btn btn-danger"
            onclick="rejectBusiness('${id}')">

            Reject

          </button>

        </div>
      `;

      list.appendChild(item);

    });

  } catch(err){

    console.error(
      "[PENDING] Failed:",
      err
    );

    list.innerHTML = `
      <p>Error loading submissions.</p>
    `;
  }
}

// ======================================
// LOAD CLAIMS
// ======================================

async function loadClaims(){

  const list =
    document.getElementById("claimsList");

  if(!list || !db){
    return;
  }

  list.innerHTML = `
    <p>Loading claims...</p>
  `;

  try{

    console.log("[CLAIMS] Loading");

    const snap = await db
      .collection("claims")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    console.log(
      "[CLAIMS] Found:",
      snap.size
    );

    if(snap.empty){

      list.innerHTML = `
        <p>No pending claims.</p>
      `;

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const c = doc.data();
      const id = doc.id;

      const item =
        document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <h3>
          Claim for:
          ${c.slug || "Unknown"}
        </h3>

        <p>
          <strong>Name:</strong>
          ${c.name || "N/A"}
        </p>

        <p>
          <strong>Email:</strong>
          ${c.email || "N/A"}
        </p>

        <p>
          <strong>Message:</strong><br>
          ${c.message || "No message"}
        </p>

        <div class="pending-actions">

          <button
            class="btn btn-success"
            onclick="approveClaim('${id}')">

            Approve Claim

          </button>

          <button
            class="btn btn-danger"
            onclick="rejectClaim('${id}')">

            Reject Claim

          </button>

        </div>
      `;

      list.appendChild(item);

    });

  } catch(err){

    console.error(
      "[CLAIMS] Failed:",
      err
    );

    list.innerHTML = `
      <p>Error loading claims.</p>
    `;
  }
}

// ======================================
// LOAD PENDING OWNER CHANGES
// ======================================

async function loadPendingChanges(){

  const list =
    document.getElementById(
      "pendingChangesList"
    );

  if(!list || !db){
    return;
  }

  list.innerHTML = `
    <p>Loading owner edits...</p>
  `;

  try{

    console.log(
      "[PENDING_CHANGES] Loading"
    );

    const snap = await db
      .collection("pending_changes")
      .orderBy("submittedAt", "desc")
      .get();

    console.log(
      "[PENDING_CHANGES] Found:",
      snap.size
    );

    if(snap.empty){

      list.innerHTML = `
        <p>No pending owner edits.</p>
      `;

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const data = doc.data();
      const id = doc.id;

      const item =
        document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <h3>
          Pending Changes
        </h3>

        <p>
          <strong>Business ID:</strong>
          ${data.businessId || id}
        </p>

        <p>
          <strong>Owner:</strong>
          ${data.ownerId || "Unknown"}
        </p>

        <p>
          <strong>Status:</strong>
          ${data.status || "Pending"}
        </p>

        ${
          data.submittedAt
            ? `
              <p class="pending-date">
                Submitted:
                ${new Date(
                  data.submittedAt.seconds * 1000
                ).toLocaleString()}
              </p>
            `
            : ""
        }

        <details class="pending-json">

          <summary>
            View Submitted Data
          </summary>

          <pre>
${JSON.stringify(data, null, 2)}
          </pre>

        </details>

        <div class="pending-actions">

          <button
            class="btn btn-success"
            onclick="approvePendingChanges('${id}')">

            Approve

          </button>

          <button
            class="btn btn-danger"
            onclick="rejectPendingChanges('${id}')">

            Reject

          </button>

        </div>
      `;

      list.appendChild(item);

    });

  } catch(err){

    console.error(
      "[PENDING_CHANGES] Failed:",
      err
    );

    list.innerHTML = `
      <p>Error loading owner edits.</p>
    `;
  }
}

// ======================================
// APPROVE BUSINESS
// ======================================

async function approveBusiness(id){

  try{

    console.log(
      "[ADMIN] Approving business:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/approveBusiness",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({ id })
      }
    );

    if(!res.ok){
      throw new Error(
        "Approve request failed"
      );
    }

    await loadPending();

  } catch(err){

    console.error(err);

    alert(
      "Failed to approve business"
    );
  }
}

// ======================================
// REJECT BUSINESS
// ======================================

async function rejectBusiness(id){

  try{

    console.log(
      "[ADMIN] Rejecting business:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/rejectBusiness",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({ id })
      }
    );

    if(!res.ok){
      throw new Error(
        "Reject request failed"
      );
    }

    await loadPending();

  } catch(err){

    console.error(err);

    alert(
      "Failed to reject business"
    );
  }
}

// ======================================
// APPROVE CLAIM
// ======================================

async function approveClaim(id){

  try{

    console.log(
      "[ADMIN] Approving claim:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/approveClaim",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          claimId: id
        })
      }
    );

    if(!res.ok){
      throw new Error(
        "Approve claim failed"
      );
    }

    await loadClaims();

  } catch(err){

    console.error(err);

    alert(
      "Failed to approve claim"
    );
  }
}

// ======================================
// REJECT CLAIM
// ======================================

async function rejectClaim(id){

  try{

    console.log(
      "[ADMIN] Rejecting claim:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/rejectClaim",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          claimId: id
        })
      }
    );

    if(!res.ok){
      throw new Error(
        "Reject claim failed"
      );
    }

    await loadClaims();

  } catch(err){

    console.error(err);

    alert(
      "Failed to reject claim"
    );
  }
}

// ======================================
// APPROVE OWNER CHANGES
// ======================================

async function approvePendingChanges(id){

  try{

    console.log(
      "[ADMIN] Approving changes:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/approvePendingChanges",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          businessId: id
        })
      }
    );

    if(!res.ok){
      throw new Error(
        "Approve changes failed"
      );
    }

    await loadPendingChanges();

  } catch(err){

    console.error(err);

    alert(
      "Failed to approve changes"
    );
  }
}

// ======================================
// REJECT OWNER CHANGES
// ======================================

async function rejectPendingChanges(id){

  try{

    console.log(
      "[ADMIN] Rejecting changes:",
      id
    );

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/rejectPendingChanges",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({ id })
      }
    );

    if(!res.ok){
      throw new Error(
        "Reject changes failed"
      );
    }

    await loadPendingChanges();

  } catch(err){

    console.error(err);

    alert(
      "Failed to reject changes"
    );
  }
}
