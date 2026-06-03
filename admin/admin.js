// ===============================
// STATE
// ===============================
let db, auth;
let RANGE = 30;
window.__visits = [];

// ===============================
// FIREBASE INIT
// ===============================
async function initFirebase() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  if (!res.ok) throw new Error("Firebase config failed");

  const config = await res.json();

  if (!firebase.apps.length) firebase.initializeApp(config);

  return {
    auth: firebase.auth(),
    db: firebase.firestore()
  };
}

// ===============================
// BOOTSTRAP
// ===============================
(async () => {
  try {
    ({ auth, db } = await initFirebase());
    setupAuth();
  } catch (e) {
    console.error(e);
  }
})();

// ===============================
// AUTH
// ===============================
function setupAuth() {
  const loginBtn = document.getElementById("loginBtn");
  const loginSection = document.getElementById("loginSection");
  const dashboard = document.getElementById("dashboardSection");

  loginBtn.onclick = async () => {
    try {
      const email = adminEmail.value.trim();
      const pass = adminPassword.value.trim();
      await auth.signInWithEmailAndPassword(email, pass);
    } catch {
      loginMessage.textContent = "Invalid login";
    }
  };

  auth.onAuthStateChanged(async user => {
    if (!user) {
      loginSection.style.display = "block";
      dashboard.style.display = "none";
      return;
    }

    loginSection.style.display = "none";
    dashboard.style.display = "block";

    loadPending();
    loadAnalytics();
  });
}

// ===============================
// PENDING BUSINESSES
// ===============================
async function loadPending() {
  const list = document.getElementById("pendingList");
  list.innerHTML = "Loading...";

  const snap = await db.collection("pending_submissions")
    .orderBy("createdAt", "desc")
    .get();

  list.innerHTML = "";

  snap.forEach(doc => {
    const b = doc.data();

    list.innerHTML += `
      <div class="pending-item">
        <h3>${b.name}</h3>
        <p>${b.category} • ${b.town}</p>

        ${b.phone ? `<p>📞 <a href="tel:${b.phone}">${b.phone}</a></p>` : ""}

        ${b.website ? `
          <p>🌐 <a href="${formatUrl(b.website)}" target="_blank">Visit</a></p>
        ` : ""}

        ${b.wasteLicence ? `<p>Licence: ${b.wasteLicence}</p>` : ""}

        <button onclick="approveBusiness('${doc.id}')">Approve</button>
        <button onclick="rejectBusiness('${doc.id}')">Reject</button>
      </div>
    `;
  });
}

// ===============================
// WEBSITE FIX (IMPORTANT FIX YOU ASKED)
// ===============================
function formatUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
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
      Authorization: `Bearer ${token}`
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ id })
  });

  loadPending();
}

// ===============================
// ANALYTICS
// ===============================
async function loadAnalytics() {
  const token = await auth.currentUser.getIdToken();

  const res = await fetch("/.netlify/functions/getAnalytics", {
    headers: { Authorization: `Bearer ${token}` }
  });

  window.__visits = await res.json();
  renderAnalytics();
}

function setRange(days) {
  RANGE = days;
  renderAnalytics();
}

function renderAnalytics() {
  const visits = window.__visits.filter(v =>
    Date.now() - (v.timestamp || 0) < RANGE * 86400000
  );

  totalVisits.innerText = visits.length;

  const clients = {};

  visits.forEach(v => {
    const id = v.clientId || "unknown";

    clients[id] ||= {
      total: 0,
      mobile: 0,
      sources: {},
      events: { whatsapp: 0, phone: 0, form: 0 }
    };

    const c = clients[id];
    c.total++;

    if (v.device === "Mobile") c.mobile++;

    const src = detectSource(v.referrer);
    c.sources[src] = (c.sources[src] || 0) + 1;

    if (v.event === "whatsapp_click") c.events.whatsapp++;
    if (v.event === "phone_tap") c.events.phone++;
    if (v.event === "form_submit") c.events.form++;
  });

  totalClients.innerText = Object.keys(clients).length;

  clientsDiv.innerHTML = Object.entries(clients)
    .map(([id, c]) => `
      <div class="client">
        <h3>${id}</h3>
        <p>${c.total} visits</p>
        <p>${Math.round((c.mobile / c.total) * 100)}% mobile</p>
      </div>
    `).join("");
}

// ===============================
// SOURCE DETECTION
// ===============================
function detectSource(r = "") {
  r = r.toLowerCase();
  if (!r || r === "direct") return "Direct";
  if (r.includes("google")) return "Google";
  if (r.includes("facebook")) return "Facebook";
  if (r.includes("instagram")) return "Instagram";
  if (r.includes("tiktok")) return "TikTok";
  if (r.includes("linkedin")) return "LinkedIn";
  if (r.includes("twitter") || r.includes("x.com")) return "X";
  if (r.includes("whatsapp")) return "WhatsApp";
  return "Other";
                      }
