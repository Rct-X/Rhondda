// ======================================
// MARKETING.JS
// Admin marketing tools (frontend)
// ======================================

let db;
let auth;

// ======================================
// INIT
// ======================================

export async function initMarketing(services) {

  console.log("[MARKETING] Initialising marketing module");

  db = services.db;
  auth = services.auth;

  window.addBusiness = addBusiness;
}

// ======================================
// QUICK ADD BUSINESS
// ======================================

async function addBusiness() {

  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();
  const town = document.getElementById("town")?.value?.trim();
  const category = document.getElementById("category")?.value;

  const result = document.getElementById("result");

  if (!name || !town || !category) {
    if (result) {
      result.textContent = "Name, town and category are required.";
    }
    return;
  }

  if (result) {
    result.textContent = "Adding business...";
  }

  try {

    const token = await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/addBusiness",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          town,
          category
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add business");
    }

    if (result) {
      result.textContent = "Business added successfully.";
    }

    clearForm();

  } catch (err) {

    console.error("[MARKETING] Error:", err);

    if (result) {
      result.textContent = err.message || "Error adding business";
    }
  }
}

// ======================================
// CLEAR FORM
// ======================================

function clearForm() {

  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("town").value = "";
  document.getElementById("category").value = "";
}
