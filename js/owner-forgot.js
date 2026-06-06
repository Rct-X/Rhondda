async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let auth;

(async () => {
  const config = await loadFirebaseConfig();

if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

auth = firebase.auth();
})();

document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("statusMsg");
  const email = document.getElementById("email").value.trim();

  status.textContent = "Sending reset email…";

  try {
    await auth.sendPasswordResetEmail(email);
    status.textContent = "Reset link sent! Check your inbox.";
  } catch (err) {
    status.textContent = err.message;
  }
});
