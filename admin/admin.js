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
