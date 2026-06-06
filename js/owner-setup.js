async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db, auth, bizRef;
let existingAccount = false;

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    slug: p.get("b"),
    email: p.get("email")
  };
}

(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);

  db = firebase.firestore();
  auth = firebase.auth();

  const { slug, email } = getParams();

  if (!slug || !email) {
    document.getElementById("businessInfo").textContent =
      "Invalid setup link.";
    return;
  }

  document.getElementById("email").value = email;

  // Check if email already has an account
  const methods = await auth.fetchSignInMethodsForEmail(email);
  if (methods.length > 0) {
    existingAccount = true;

    document.getElementById("setupForm").innerHTML = `
      <p>You already have an RCTX owner account.</p>
      <p>Please log in to link this business to your dashboard.</p>

      <label>Password</label>
      <input type="password" id="password" required placeholder="Enter your password">

      <button class="btn" id="loginBtn">Log In</button>
    `;
  }

  // Load business
  const snap = await db.collection("businesses")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (snap.empty) {
    document.getElementById("businessInfo").textContent =
      "Business not found.";
    return;
  }

  const b = snap.docs[0].data();
  bizRef = snap.docs[0].ref;

  document.getElementById("businessInfo").innerHTML = `
    <strong>${b.name}</strong><br>
    ${b.category} • ${b.town}<br>
    ${b.address || ""}
  `;
})();

document.getElementById("setupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const status = document.getElementById("statusMsg");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  status.textContent = "Processing…";

  try {
    let user;

    if (existingAccount) {
      // LOGIN FLOW
      user = await auth.signInWithEmailAndPassword(email, password);
    } else {
      // SIGNUP FLOW
      user = await auth.createUserWithEmailAndPassword(email, password);
    }

    // Link business to this owner
    await bizRef.update({
      ownerId: user.user.uid,
      ownerStatus: "active",
      verified: true,
      claimedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    status.textContent = "Success! Redirecting…";

    setTimeout(() => {
      window.location.href = "/owner-dashboard";
    }, 1200);

  } catch (err) {
    console.error(err);
    status.textContent = err.message;
  }
});
