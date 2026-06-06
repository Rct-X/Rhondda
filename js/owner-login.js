// ===============================
// LOAD FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let auth = null;
let authReady = false;

// ===============================
// INITIALISE FIREBASE SAFELY
// ===============================
(async () => {
  const config = await loadFirebaseConfig();

  // Only initialise once
  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  } else {
    firebase.app(); // use existing app
  }

  auth = firebase.auth();
  authReady = true;
})();

// ===============================
// LOGIN FORM HANDLER
// ===============================
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("statusMsg");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  // Prevent login before Firebase is ready
  if (!authReady) {
    status.textContent = "Please wait… initialising.";
    return;
  }

  status.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "/owner-dashboard";
  } catch (err) {
    status.textContent = err.message;
  }
});
