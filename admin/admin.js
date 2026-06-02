// ===============================
// LOAD FIREBASE CONFIG + INIT
// ===============================
async function initFirebase() {
  const res = await fetch("/.netlify/functions/firebaseConfig");

  if (!res.ok) {
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
// INIT APP (SAFE ORDER)
// ===============================
(async () => {
  try {
    const services = await initFirebase();

    auth = services.auth;
    db = services.db;

    setupAuth();

    console.log("Firebase initialised:", { auth, db });

  } catch (err) {
    console.error("Firebase init failed:", err);
    loginMessage.textContent = "System error. Please refresh.";
  }
})();

// ===============================
// AUTH + LOGIN HANDLERS
// ===============================
function setupAuth() {
  if (!auth) return;

  // LOGIN BUTTON
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    loginMessage.textContent = "";

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      console.error("Login error:", err);
      loginMessage.textContent = "Invalid login.";
    }
  });

  // AUTH STATE CHANGE
  auth.onAuthStateChanged((user) => {
    if (user) {
      loginSection.style.display = "none";
      dashboardSection.style.display = "block";

      loadPending().catch(err => {
        console.error("loadPending failed:", err);
      });

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

  if (!db) {
    console.error("Firestore not initialised");
    return;
  }

  list.innerHTML = "<p>Loading…</p>";

  try {
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
        <h3>${b.name || "No name"}</h3>
        <p>${b.category || "No category"} • ${b.town || "No town"}</p>
        <p>${b.description || ""}</p>

        <div class="pending-actions">
          <button class="btn-approve" onclick="approveBusiness('${id}')">Approve</button>
          <button class="btn-reject" onclick="rejectBusiness('${id}')">Reject</button>
        </div>
      `;

      list.appendChild(item);
    });

  } catch (err) {
    console.error("Firestore error:", err);
    list.innerHTML = "<p>Error loading submissions.</p>";
  }
}

// ===============================
// APPROVE BUSINESS
// ===============================
async function approveBusiness(id) {
  try {
    await fetch("/.netlify/functions/approveBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    loadPending();

  } catch (err) {
    console.error("Approve failed:", err);
  }
}

// ===============================
// REJECT BUSINESS
// ===============================
async function rejectBusiness(id) {
  try {
    await fetch("/.netlify/functions/rejectBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    loadPending();

  } catch (err) {
    console.error("Reject failed:", err);
  }
}
