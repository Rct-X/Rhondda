// ===============================
// LOAD FIREBASE CONFIG + INIT
// ===============================
async function initFirebase() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
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
// INIT APP (WAIT FOR FIREBASE)
// ===============================
(async () => {
  const firebaseServices = await initFirebase();

  auth = firebaseServices.auth;
  db = firebaseServices.db;

  setupAuth();        // safe to run now
  loadPending();      // optional preload if needed
})();

// ===============================
// ELEMENTS
// ===============================
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

// ===============================
// LOGIN (SAFE AFTER INIT)
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

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";
      loadPending();
    } else {
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
  list.innerHTML = "<p>Loading…</p>";

  const snap = await db.collection("pending_submissions")
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
      <h3>${b.name}</h3>
      <p>${b.category} • ${b.town}</p>
      <p>${b.description}</p>

      <div class="pending-actions">
        <button class="btn-approve" onclick="approveBusiness('${id}')">Approve</button>
        <button class="btn-reject" onclick="rejectBusiness('${id}')">Reject</button>
      </div>
    `;

    list.appendChild(item);
  });
}

// ===============================
// APPROVE
// ===============================
async function approveBusiness(id) {
  await fetch("/.netlify/functions/approveBusiness", {
    method: "POST",
    body: JSON.stringify({ id })
  });

  loadPending();
}

// ===============================
// REJECT
// ===============================
async function rejectBusiness(id) {
  await fetch("/.netlify/functions/rejectBusiness", {
    method: "POST",
    body: JSON.stringify({ id })
  });

  loadPending();
}
