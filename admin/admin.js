// ===============================
// LOAD FIREBASE CONFIG + INIT
// ===============================
async function initFirebase() {

  console.log("[initFirebase] Starting Firebase initialisation…");

  const res = await fetch("/.netlify/functions/firebaseConfig");

  if (!res.ok) {
    console.error("[initFirebase] Failed to load Firebase config");
    throw new Error("Failed to load Firebase config");
  }

  const config = await res.json();

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  return {
    auth: firebase.auth(),
    db: firebase.firestore()
  };
}

let db;
let auth;

// ===============================
// ELEMENTS
// ===============================
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

// ===============================
// INIT APP
// ===============================
(async () => {

  try {

    const services = await initFirebase();

    auth = services.auth;
    db = services.db;

    setupAuth();

  } catch (err) {
    console.error(err);
    loginMessage.textContent = "System error. Please refresh.";
  }

})();

// ===============================
// AUTH
// ===============================
function setupAuth() {

  loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    loginMessage.textContent = "";

    try {

      await auth.signInWithEmailAndPassword(email, password);

      console.log("[AUTH] Admin login successful");

    } catch (err) {

      console.error("[AUTH] Login failed:", err);

      loginMessage.textContent = "Invalid login.";
    }

  });

  auth.onAuthStateChanged((user) => {

    console.log("[AUTH] Auth state changed");

    if (user) {

      console.log("[AUTH] Admin logged in:", user.uid);

      loginSection.style.display = "none";
      dashboardSection.style.display = "block";

      const analyticsSection =
        document.getElementById("analyticsSection");

      if (analyticsSection) {
        analyticsSection.style.display = "block";
      }

      loadPending().catch(console.error);
      loadClaims().catch(console.error);
      loadAnalytics().catch(console.error);

      // ✅ NEW
      loadPendingChanges().catch(console.error);

    } else {

      console.log("[AUTH] No admin user");

      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }

  });
}

// ===============================
// LOAD PENDING SUBMISSIONS
// ===============================
async function loadPending() {

  const list = document.getElementById("pendingList");

  if (!db) return;

  list.innerHTML = "<p>Loading…</p>";

  try {

    console.log("[PENDING] Loading pending submissions");

    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .get();

    console.log("[PENDING] Found submissions:", snap.size);

    if (snap.empty) {

      list.innerHTML = "<p>No pending submissions.</p>";

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const b = doc.data();
      const id = doc.id;

      const item = document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <h3>${b.name || "No name"}</h3>

        <p><strong>Category:</strong> ${b.category || "N/A"}</p>

        <p><strong>Town:</strong> ${b.town || "N/A"}</p>

        <p><strong>Phone:</strong> ${b.phone || "N/A"}</p>

        <p>
          <strong>Website:</strong>
          ${
            b.website
              ? `<a href="${b.website}" target="_blank" rel="noopener noreferrer">${b.website}</a>`
              : "N/A"
          }
        </p>

        <p><strong>Address:</strong> ${b.address || "N/A"}</p>

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
              <p>
                <strong>Submitted:</strong>
                ${new Date(
                  b.createdAt.seconds * 1000
                ).toLocaleString()}
              </p>
            `
            : ""
        }

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

  } catch (err) {

    console.error("[PENDING] Failed loading submissions:", err);

    list.innerHTML =
      "<p>Error loading submissions.</p>";
  }
}

// ===============================
// LOAD PENDING OWNER CHANGES
// ===============================
async function loadPendingChanges() {

  console.log("[PENDING_CHANGES] Loading owner edits");

  const list =
    document.getElementById("pendingChangesList");

  if (!list) {

    console.warn(
      "[PENDING_CHANGES] Missing #pendingChangesList element"
    );

    return;
  }

  list.innerHTML = "<p>Loading…</p>";

  try {

    const snap = await db
      .collection("pending_changes")
      .get();

    console.log(
      "[PENDING_CHANGES] Documents found:",
      snap.size
    );

    if (snap.empty) {

      list.innerHTML =
        "<p>No pending owner edits.</p>";

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const data = doc.data();
      const id = doc.id;

      console.log(
        "[PENDING_CHANGES] Rendering:",
        id,
        data
      );

      const item =
        document.createElement("div");

      item.className =
        "pending-item";

      item.innerHTML = `
        <h3>
          Changes for:
          ${data.businessId || id}
        </h3>

        <p>
          <strong>Status:</strong>
          ${data.status || "unknown"}
        </p>

        <p>
          <strong>Owner:</strong>
          ${data.ownerId || "unknown"}
        </p>

        ${
          data.submittedAt
            ? `
              <p>
                <strong>Submitted:</strong>
                ${new Date(
                  data.submittedAt.seconds * 1000
                ).toLocaleString()}
              </p>
            `
            : ""
        }

        <pre>
${JSON.stringify(data, null, 2)}
        </pre>

        <div class="pending-actions">

          <button onclick="approvePendingChanges('${id}')">
            Approve
          </button>

          <button onclick="rejectPendingChanges('${id}')">
            Reject
          </button>

        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {

    console.error(
      "[PENDING_CHANGES] Failed loading:",
      err
    );

    list.innerHTML =
      "<p>Error loading pending changes.</p>";
  }
}

// ===============================
// LOAD CLAIMS
// ===============================
async function loadClaims() {

  const list = document.getElementById("claimsList");

  if (!db) return;

  list.innerHTML = "<p>Loading claims…</p>";

  try {

    console.log("[CLAIMS] Loading claims");

    const snap = await db
      .collection("claims")
      .where("status", "==", "pending")
      .orderBy("createdAt", "desc")
      .get();

    console.log("[CLAIMS] Claims found:", snap.size);

    if (snap.empty) {

      list.innerHTML = "<p>No pending claims.</p>";

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const c = doc.data();
      const id = doc.id;

      const item = document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <h3>Claim for: ${c.slug}</h3>

        <p><strong>Name:</strong> ${c.name}</p>

        <p><strong>Email:</strong> ${c.email}</p>

        <p>
          <strong>Message:</strong><br>
          ${c.message || "No message"}
        </p>

        <div class="pending-actions">

          <button onclick="approveClaim('${id}')">
            Approve Claim
          </button>

          <button onclick="rejectClaim('${id}')">
            Reject Claim
          </button>

        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {

    console.error("[CLAIMS] Failed loading claims:", err);

    list.innerHTML =
      "<p>Error loading claims.</p>";
  }
}

// ===============================
// APPROVE / REJECT BUSINESS
// ===============================
async function approveBusiness(id) {

  console.log("[ADMIN] Approving business:", id);

  const token =
    await auth.currentUser.getIdToken();

  await fetch("/.netlify/functions/approveBusiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  loadPending();
}

async function rejectBusiness(id) {

  console.log("[ADMIN] Rejecting business:", id);

  const token =
    await auth.currentUser.getIdToken();

  await fetch("/.netlify/functions/rejectBusiness", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  loadPending();
}

// ===============================
// APPROVE / REJECT CLAIM
// ===============================
async function approveClaim(id) {

  console.log("[ADMIN] Approving claim:", id);

  const token =
    await auth.currentUser.getIdToken();

  await fetch("/.netlify/functions/approveClaim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ claimId: id })
  });

  loadClaims();
}

async function rejectClaim(id) {

  console.log("[ADMIN] Rejecting claim:", id);

  const token =
    await auth.currentUser.getIdToken();

  await fetch("/.netlify/functions/rejectClaim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ claimId: id })
  });

  loadClaims();
}

// ===============================
// APPROVE / REJECT PENDING CHANGES
// ===============================
async function approvePendingChanges(id) {
  console.log("[ADMIN] Approving pending changes:", id);

  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/.netlify/functions/approvePendingChanges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ businessId: id })
  });

  if (!res.ok) {
    console.error("[ADMIN] Approve failed:", res.status);
    return;
  }

  loadPendingChanges();
}

async function rejectPendingChanges(id) {

  console.log(
    "[ADMIN] Rejecting pending changes:",
    id
  );

  const token =
    await auth.currentUser.getIdToken();

  await fetch(
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

  loadPendingChanges();
}

// ===============================
// ANALYTICS STATE
// ===============================
let RANGE = 30;

window.setRange = function(days){

  RANGE = days;

  document.querySelectorAll(".filters button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById("f" + days)
    .classList.add("active");

  renderDashboard(window.__visits || []);
};

function detectSource(referrer){

  if(!referrer || referrer === "direct") {
    return "Direct";
  }

  const r = referrer.toLowerCase();

  if(r.includes("google")) return "Google";
  if(r.includes("facebook")) return "Facebook";
  if(r.includes("instagram")) return "Instagram";
  if(r.includes("tiktok")) return "TikTok";
  if(r.includes("linkedin")) return "LinkedIn";
  if(r.includes("twitter") || r.includes("x.com")) return "X / Twitter";
  if(r.includes("whatsapp")) return "WhatsApp";
  if(r.includes("rctx.co.uk")) return "RCTX Website";

  return "Other";
}

function filterByDate(visits, days){

  const now = Date.now();

  return visits.filter(v =>
    now - (v.timestamp || 0) <= days * 86400000
  );
}

function renderDashboard(visits){

  visits = filterByDate(visits, RANGE);

  document.getElementById("totalVisits").innerText =
    visits.length;

  const clients = {};

  visits.forEach(v => {

    const c = v.clientId || "unknown";

    if(!clients[c]){

      clients[c] = {
        total:0,
        mobile:0,
        pages:{},
        sources:{},
        events:{
          whatsapp:0,
          phone:0,
          form:0
        }
      };
    }

    clients[c].total++;

    const source =
      detectSource(v.referrer);

    clients[c].sources[source] =
      (clients[c].sources[source] || 0) + 1;

    if(v.device === "Mobile"){
      clients[c].mobile++;
    }

    const page = v.page || "/";

    clients[c].pages[page] =
      (clients[c].pages[page] || 0) + 1;

    if(v.event === "whatsapp_click"){
      clients[c].events.whatsapp++;
    }

    if(v.event === "phone_tap"){
      clients[c].events.phone++;
    }

    if(v.event === "form_submit"){
      clients[c].events.form++;
    }
  });

  document.getElementById("totalClients").innerText =
    Object.keys(clients).length;

  const wrap =
    document.getElementById("clients");

  wrap.innerHTML = "";

  Object.entries(clients)
    .forEach(([name,data]) => {

      const topPage =
        Object.entries(data.pages)
          .sort((a,b)=>b[1]-a[1])[0]?.[0] || "/";

      const mobilePercent =
        data.total
          ? Math.round((data.mobile/data.total)*100)
          : 0;

      const topSources =
        Object.entries(data.sources)
          .sort((a,b)=>b[1]-a[1])
          .slice(0,5)
          .map(([s,c])=>`<li>${s}: ${c}</li>`)
          .join("");

      wrap.innerHTML += `
        <div class="client">

          <h3>${name}</h3>

          <div>${data.total} visits</div>

          <div>${topPage}</div>

          <div>${mobilePercent}% mobile</div>

          <div>
            WhatsApp:
            ${data.events.whatsapp}
          </div>

          <div>
            Phone:
            ${data.events.phone}
          </div>

          <div>
            Forms:
            ${data.events.form}
          </div>

          <ul>${topSources}</ul>

        </div>
      `;
    });
}

async function loadAnalytics(){

  try{

    console.log("[ANALYTICS] Loading analytics");

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/getAnalytics",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if(!res.ok){
      throw new Error("Analytics failed");
    }

    const visits = await res.json();

    console.log(
      "[ANALYTICS] Visits loaded:",
      visits.length
    );

    window.__visits = visits;

    renderDashboard(visits);

  } catch(err){

    console.error(
      "[ANALYTICS] Failed:",
      err
    );
  }
      }

// ===============================
// DELETE ANALYTICS RANGE
// ===============================

async function deleteAnalyticsRange(){

  const start =
    document.getElementById("analyticsStart").value;

  const end =
    document.getElementById("analyticsEnd").value;

  if(!start || !end){

    alert("Select start and end dates");

    return;
  }

  if(
    !confirm(
      `Delete analytics from ${start} to ${end}?`
    )
  ){
    return;
  }

  try{

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/deleteAnalyticsRange",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${token}`
        },
        body:JSON.stringify({
          start,
          end
        })
      }
    );

    const data = await res.json();

    alert(data.message);

    loadAnalytics();

  } catch(err){

    console.error(err);

    alert("Delete failed");
  }
}

// ===============================
// DELETE ALL
// ===============================

async function deleteAllAnalytics(){

  if(
    !confirm(
      "Delete ALL analytics permanently?"
    )
  ){
    return;
  }

  try{

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/deleteAnalyticsRange",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${token}`
        },
        body:JSON.stringify({
          all:true
        })
      }
    );

    const data = await res.json();

    alert(data.message);

    loadAnalytics();

  } catch(err){

    console.error(err);

    alert("Delete failed");
  }
}
