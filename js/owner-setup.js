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

  status.textContent = "Creating your account…";

  try {
    const user = await auth.createUserWithEmailAndPassword(email, password);

    await bizRef.update({
      ownerId: user.user.uid,
      ownerStatus: "active",
      verified: true
    });

    status.textContent = "Account created! Redirecting…";

    setTimeout(() => {
      window.location.href = "/owner-dashboard";
    }, 1200);

  } catch (err) {
    console.error(err);
    status.textContent = err.message;
  }
});
