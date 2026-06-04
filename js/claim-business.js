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

// Load business info
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

  const btn = document.querySelector(".btn");
  const status = document.getElementById("statusMsg");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const slug = document.getElementById("businessSlug").value;

  // Start loading state
  btn.disabled = true;
  btn.classList.add("loading");
  btn.textContent = "Submitting";

  status.textContent = "Please wait…";

  try {
    const res = await fetch("/.netlify/functions/submitClaim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, slug })
    });

    const data = await res.json();

    // Success UI
    status.textContent = "Thank you! Your claim has been submitted.";
    status.style.color = "green";

    // Hide form
    document.getElementById("claimForm").style.display = "none";

  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong. Please try again.";
    status.style.color = "red";
  }

  // End loading state
  btn.disabled = false;
  btn.classList.remove("loading");
  btn.textContent = "Submit Claim";
});
