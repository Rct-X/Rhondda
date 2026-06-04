// Load Firebase config
async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db;

// Read ?b=slug
function getSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("b");
}

(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);
  db = firebase.firestore();

  const slug = getSlug();
  document.getElementById("businessSlug").value = slug;

  const q = db.collection("businesses").where("slug", "==", slug);
  const snap = await q.get();

  if (snap.empty) {
    document.getElementById("businessInfo").textContent = "Business not found.";
    return;
  }

  const b = snap.docs[0].data();

  document.getElementById("businessInfo").innerHTML = `
    <strong>${b.name}</strong><br>
    ${b.category} • ${b.town}<br>
    ${b.address || ""}
  `;
})();

// Submit claim
document.getElementById("claimForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const slug = document.getElementById("businessSlug").value;

  const res = await fetch("/.netlify/functions/submitClaim", {
    method: "POST",
    body: JSON.stringify({ name, email, message, slug })
  });

  const data = await res.json();

  document.getElementById("statusMsg").textContent = data.message;
});
