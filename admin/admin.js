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
    } catch (err) {
      loginMessage.textContent = "Invalid login.";
    }

  });

  // ✅ FIXED BLOCK (THIS WAS BROKEN BEFORE)
  auth.onAuthStateChanged((user) => {

    if (user) {

      loginSection.style.display = "none";
      dashboardSection.style.display = "block";

      const analyticsSection = document.getElementById("analyticsSection");
      if (analyticsSection) analyticsSection.style.display = "block";

      loadPending().catch(console.error);
      loadAnalytics().catch(console.error);

    } else {

      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }

  });
}

// ===============================
// LOAD PENDING
// ===============================
async function loadPending() {

  const list = document.getElementById("pendingList");

  if (!db) return;

  list.innerHTML = "<p>Loading…</p>";

  try {

    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .get();

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
                ${new Date(b.createdAt.seconds * 1000).toLocaleString()}
              </p>
            `
            : ""
        }

        <div class="pending-actions">

          <button onclick="approveBusiness('${id}')">
            Approve
          </button>

          <button onclick="rejectBusiness('${id}')">
            Reject
          </button>

        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>Error loading submissions.</p>";
  }
}
// ===============================
// APPROVE / REJECT
// ===============================
async function approveBusiness(id) {
  const token = await auth.currentUser.getIdToken();

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
  const token = await auth.currentUser.getIdToken();

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
// ANALYTICS STATE
// ===============================
let RANGE = 30;

window.setRange = function(days){
  RANGE = days;

  document.querySelectorAll(".filters button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById("f" + days).classList.add("active");

  renderDashboard(window.__visits || []);
};

function detectSource(referrer){
  if(!referrer || referrer === "direct") return "Direct";

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
  return visits.filter(v => now - (v.timestamp || 0) <= days * 86400000);
}

function renderDashboard(visits){

  visits = filterByDate(visits, RANGE);

  document.getElementById("totalVisits").innerText = visits.length;

  const clients = {};

  visits.forEach(v => {

    const c = v.clientId || "unknown";

    if(!clients[c]){
      clients[c] = {
        total:0,
        mobile:0,
        pages:{},
        sources:{},
        events:{ whatsapp:0, phone:0, form:0 }
      };
    }

    clients[c].total++;

    const source = detectSource(v.referrer);
    clients[c].sources[source] = (clients[c].sources[source] || 0) + 1;

    if(v.device === "Mobile") clients[c].mobile++;

    const page = v.page || "/";
    clients[c].pages[page] = (clients[c].pages[page] || 0) + 1;

    if(v.event === "whatsapp_click") clients[c].events.whatsapp++;
    if(v.event === "phone_tap") clients[c].events.phone++;
    if(v.event === "form_submit") clients[c].events.form++;
  });

  document.getElementById("totalClients").innerText =
    Object.keys(clients).length;

  const wrap = document.getElementById("clients");
  wrap.innerHTML = "";

  Object.entries(clients).forEach(([name,data]) => {

    const topPage =
      Object.entries(data.pages).sort((a,b)=>b[1]-a[1])[0]?.[0] || "/";

    const mobilePercent =
      data.total ? Math.round((data.mobile/data.total)*100) : 0;

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
        <div>WhatsApp: ${data.events.whatsapp}</div>
        <div>Phone: ${data.events.phone}</div>
        <div>Forms: ${data.events.form}</div>
        <ul>${topSources}</ul>
      </div>
    `;
  });
}

async function loadAnalytics(){

  try{

    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/getAnalytics", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if(!res.ok) throw new Error("Analytics failed");

    const visits = await res.json();

    window.__visits = visits;
    renderDashboard(visits);

  } catch(err){
    console.error(err);
  }
}
