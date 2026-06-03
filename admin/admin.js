// ===============================
// LOAD FIREBASE CONFIG + INIT
// ===============================
async function initFirebase() {

  console.log("[initFirebase] Starting Firebase initialisation…");

  const res = await fetch("/.netlify/functions/firebaseConfig");

  console.log("[initFirebase] Config fetch response:", res);

  if (!res.ok) {
    console.error("[initFirebase] Failed to load Firebase config");

    throw new Error("Failed to load Firebase config");
  }

  const config = await res.json();

  console.log("[initFirebase] Firebase config loaded:", config);

  if (!firebase.apps.length) {

    console.log("[initFirebase] Initialising Firebase app…");

    firebase.initializeApp(config);

  } else {

    console.log("[initFirebase] Firebase already initialised");
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

  console.log("[App Init] Starting…");

  try {

    const services = await initFirebase();

    auth = services.auth;
    db = services.db;

    console.log("[App Init] Firebase services ready:", {
      auth,
      db
    });

    setupAuth();

  } catch (err) {

    console.error("[App Init] Firebase init failed:", err);

    loginMessage.textContent =
      "System error. Please refresh.";
  }

})();

// ===============================
// AUTH + LOGIN
// ===============================
function setupAuth() {

  console.log("[setupAuth] Setting up auth listeners…");

  if (!auth) {
    console.error("[setupAuth] Auth not ready");
    return;
  }

  // LOGIN BUTTON
  loginBtn.addEventListener("click", async () => {

    console.log("[Login] Login button clicked");

    const email =
      document.getElementById("adminEmail")
      .value
      .trim();

    const password =
      document.getElementById("adminPassword")
      .value
      .trim();

    console.log("[Login] Attempting login with:", email);

    loginMessage.textContent = "";

    try {

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      console.log("[Login] Login successful");

    } catch (err) {

      console.error("[Login] Login error:", err);

      loginMessage.textContent = "Invalid login.";
    }

  });

  // AUTH STATE
  auth.onAuthStateChanged((user) => {

    console.log("[AuthState] User changed:", user);

    if (user) {

      console.log("[AuthState] Logged in as:", user.email);

      loginSection.style.display = "none";
      dashboardSection.style.display = "block";

      loadPending().catch(err => {
        console.error(
          "[AuthState] loadPending failed:",
          err
        );
      });

    } else {

      console.log("[AuthState] Logged out");

      loginSection.style.display = "block";
      dashboardSection.style.display = "none";
    }

  });

}

// ===============================
// LOAD PENDING SUBMISSIONS
// ===============================
async function loadPending() {

  console.log("[loadPending] Loading pending submissions…");

  const list = document.getElementById("pendingList");

  if (!db) {

    console.error("[loadPending] Firestore not initialised");

    return;
  }

  list.innerHTML = "<p>Loading…</p>";

  try {

    const snap = await db
      .collection("pending_submissions")
      .orderBy("createdAt", "desc")
      .get();

    console.log("[loadPending] Query snapshot:", snap);

    if (snap.empty) {

      console.log("[loadPending] No pending submissions");

      list.innerHTML =
        "<p>No pending submissions.</p>";

      return;
    }

    list.innerHTML = "";

    snap.forEach(doc => {

      const b = doc.data();
      const id = doc.id;

      console.log("[loadPending] Submission:", {
        id,
        data: b
      });

      const item = document.createElement("div");

      item.className = "pending-item";

      item.innerHTML = `
        <div class="pending-top">

          <h3>
            ${b.name || "No name"}
          </h3>

          <p class="pending-meta">
            ${b.category || "No category"}
            •
            ${b.town || "No town"}
          </p>

        </div>

        ${
          b.description
            ? `
            <p class="pending-description">
              ${b.description}
            </p>
            `
            : ""
        }

        <div class="pending-details">

          ${
            b.phone
              ? `
              <p>
                <strong>Phone:</strong>

                <a href="tel:${b.phone}">
                  ${b.phone}
                </a>
              </p>
              `
              : ""
          }

          ${
            b.website
              ? `
              <p>
                <strong>Website:</strong>

                <a
                  href="${b.website}"
                  target="_blank"
                  rel="noopener"
                >
                  ${b.website}
                </a>
              </p>
              `
              : ""
          }

          ${
            b.address
              ? `
              <p>
                <strong>Address:</strong>
                ${b.address}
              </p>
              `
              : ""
          }

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

        </div>

        <div class="pending-actions">

          <button
            class="btn-approve"
            onclick="approveBusiness('${id}')"
          >
            Approve
          </button>

          <button
            class="btn-reject"
            onclick="rejectBusiness('${id}')"
          >
            Reject
          </button>

        </div>
      `;

      list.appendChild(item);

    });

  } catch (err) {

    console.error("[loadPending] Firestore error:", err);

    list.innerHTML =
      "<p>Error loading submissions.</p>";
  }

}

// ===============================
// APPROVE BUSINESS
// ===============================
async function approveBusiness(id) {

  console.log("[approveBusiness] Approving:", id);

  try {

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

    console.log("[approveBusiness] Response:", res);

    loadPending();

  } catch (err) {

    console.error(
      "[approveBusiness] Approve failed:",
      err
    );

  }

}

// ===============================
// REJECT BUSINESS
// ===============================
async function rejectBusiness(id) {

  console.log("[rejectBusiness] Rejecting:", id);

  try {

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

    console.log("[rejectBusiness] Response:", res);

    loadPending();

  } catch (err) {

    console.error(
      "[rejectBusiness] Reject failed:",
      err
    );

  }

}

let RANGE = 30;

window.setRange = function(days){

  RANGE = days;

  document
    .querySelectorAll(".filters button")
    .forEach(b => b.classList.remove("active"));

  document
    .getElementById("f" + days)
    .classList.add("active");

  renderDashboard(window.__visits || []);

};

function detectSource(referrer){

  if(!referrer || referrer === "direct"){
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

  return visits.filter(v => {

    const t = v.timestamp || 0;

    return now - t <= days * 86400000;

  });

}

function renderDashboard(visits){

  visits = filterByDate(visits, RANGE);

  document.getElementById("totalVisits").innerText =
    visits.length;

  const clients = {};

  visits.forEach(v => {

    const client = v.clientId || "unknown";

    if(!clients[client]){

      clients[client] = {
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

    clients[client].total++;

    const source =
      detectSource(v.referrer);

    clients[client].sources[source] =
      (clients[client].sources[source] || 0) + 1;

    if(v.device === "Mobile"){
      clients[client].mobile++;
    }

    const page = v.page || "/";

    clients[client].pages[page] =
      (clients[client].pages[page] || 0) + 1;

    if(v.event === "whatsapp_click"){
      clients[client].events.whatsapp++;
    }

    if(v.event === "phone_tap"){
      clients[client].events.phone++;
    }

    if(v.event === "form_submit"){
      clients[client].events.form++;
    }

  });

  document.getElementById("totalClients").innerText =
    Object.keys(clients).length;

  const wrap =
    document.getElementById("clients");

  wrap.innerHTML = "";

  Object.entries(clients).forEach(([name,data]) => {

    const topPage =
      Object.entries(data.pages)
      .sort((a,b)=>b[1]-a[1])[0]?.[0] || "/";

const mobilePercent =
  data.total
    ? Math.round((data.mobile / data.total) * 100)
    : 0;

    const topSources =
      Object.entries(data.sources)
      .sort((a,b)=>b[1]-a[1])
      .slice(0,5)
      .map(([src,count]) =>
        `<li>${src}: ${count}</li>`
      )
      .join("");

    wrap.innerHTML += `

      <div class="client">

        <h3>${name}</h3>

        <div class="stat">
          ${data.total} visits
        </div>

        <div class="stat">
          Most viewed page: ${topPage}
        </div>

        <div class="stat">
          ${mobilePercent}% mobile users
        </div>

        <div class="stat">
          WhatsApp leads: ${data.events.whatsapp}
        </div>

        <div class="stat">
          Phone taps: ${data.events.phone}
        </div>

        <div class="stat">
          Form submits: ${data.events.form}
        </div>

        <div class="stat">
          Top traffic sources:
        </div>

        <ul class="small">
          ${topSources}
        </ul>

      </div>

    `;

  });

}

async function loadAnalytics(){

  try{

    const response =
      await fetch("/.netlify/functions/getAnalytics");

    if(!response.ok){
  throw new Error("Failed to load analytics");
}

const visits = await response.json();

    window.__visits = visits;

    renderDashboard(visits);

    document
      .getElementById("f30")
      .classList.add("active");

  }catch(err){

    console.error("Dashboard failed:", err);
    
    document.getElementById("totalVisits").innerText =
  "Error";

document.getElementById("totalClients").innerText =
  "Error";

  }

}
