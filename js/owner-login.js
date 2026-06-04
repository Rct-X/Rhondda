async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let auth;

(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);

  auth = firebase.auth();
})();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("statusMsg");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  status.textContent = "Logging in…";

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "/owner-dashboard";
  } catch (err) {
    status.textContent = err.message;
  }
});
