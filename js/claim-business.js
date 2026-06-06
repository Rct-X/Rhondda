// ===============================
// LOAD FIREBASE CONFIG
// ===============================
async function loadFirebaseConfig() {
  console.log("[FIREBASE] Fetching config...");
  const res = await fetch("/.netlify/functions/firebaseConfig");
  const data = await res.json();
  console.log("[FIREBASE] Config loaded:", data);
  return data;
}

let db = null;

// ===============================
// READ ?b=slug
// ===============================
function getSlug() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("b");

  console.log("[CLAIM] URL slug:", slug);
  return slug;
}

// ===============================
// LOAD BUSINESS INFO
// ===============================
(async () => {
  try {
    console.log("[INIT] Starting claim page...");

    const config = await loadFirebaseConfig();

    if (!firebase.apps.length) {
      firebase.initializeApp(config);
      console.log("[FIREBASE] Initialized new app");
    } else {
      firebase.app();
      console.log("[FIREBASE] Reusing existing app");
    }

    db = firebase.firestore();
    console.log("[FIRESTORE] Ready");

    const slug = getSlug();

    if (!slug) {
      console.error("[ERROR] Missing slug in URL");
      document.getElementById("businessInfo").textContent = "Missing business slug.";
      return;
    }

    document.getElementById("businessSlug").value = slug;

    console.log("[QUERY] Looking up business:", slug);

    const q = db.collection("businesses").where("slug", "==", slug);
    const snap = await q.get();

    console.log("[QUERY] Results:", snap.size);

    if (snap.empty) {
      console.warn("[QUERY] Business not found");
      document.getElementById("businessInfo").textContent = "Business not found.";
      return;
    }

    const b = snap.docs[0].data();
    console.log("[BUSINESS] Loaded:", b);

    document.getElementById("businessInfo").innerHTML = `
      <strong>${b.name}</strong><br>
      ${b.category} • ${b.town}<br>
      ${b.address || ""}
    `;

  } catch (err) {
    console.error("[INIT ERROR]", err);
  }
})();

// ===============================
// SUBMIT CLAIM
// ===============================
document.getElementById("claimForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.querySelector(".btn");
  const status = document.getElementById("statusMsg");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const slug = document.getElementById("businessSlug").value;

  console.log("[CLAIM] Submitting:", { name, email, slug, message });

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

    console.log("[CLAIM] Response status:", res.status);

    const data = await res.json();
    console.log("[CLAIM] Response data:", data);

    if (!res.ok) {
      throw new Error(data.error || "Claim failed");
    }

    status.textContent = "Thank you! Your claim has been submitted.";
    status.style.color = "green";

    document.getElementById("claimForm").style.display = "none";

  } catch (err) {
    console.error("[CLAIM ERROR]", err);
    status.textContent = err.message || "Something went wrong. Please try again.";
    status.style.color = "red";
  }

  btn.disabled = false;
  btn.classList.remove("loading");
  btn.textContent = "Submit Claim";
});
