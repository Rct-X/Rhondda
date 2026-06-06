async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db, auth, bizRef;

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    slug: p.get("b"),
    email: p.get("email")
  };
}

(async () => {
  const config = await loadFirebaseConfig();

// Only initialise if not already initialised
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

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

// ===============================
// FORM SUBMIT HANDLER
// ===============================
document.getElementById("setupForm")
.addEventListener("submit", async (e) => {

  e.preventDefault();

  const status =
    document.getElementById("statusMsg");

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value.trim();

  status.textContent = "Processing…";

  try {

    let cred;

    try {

      // FIRST TRY CREATE ACCOUNT
      cred = await auth
        .createUserWithEmailAndPassword(
          email,
          password
        );

    } catch (err) {

      // IF ACCOUNT EXISTS -> LOGIN
      if (
        err.code === "auth/email-already-in-use"
      ) {

        cred = await auth
          .signInWithEmailAndPassword(
            email,
            password
          );

      } else {

        throw err;
      }
    }

    await bizRef.update({
      ownerId: cred.user.uid,
      ownerEmail: email,
      ownerStatus: "active",
      verified: true,
      claimedAt:
        firebase.firestore.FieldValue.serverTimestamp()
    });

    status.textContent =
      "Success! Redirecting…";

    setTimeout(() => {
      window.location.href =
        "/owner-dashboard";
    }, 1200);

  } catch (err) {

    status.textContent = err.message;
  }
});

  try {
    let user;

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
    status.textContent = err.message;
  }
});

// ===============================
// PASSWORD RESET HANDLER
// ===============================
document.getElementById("resetBtn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const status = document.getElementById("statusMsg");

  try {
    await auth.sendPasswordResetEmail(email);
    status.textContent = "Password setup email sent. Check your inbox.";
  } catch (err) {
    status.textContent = err.message;
  }
});
