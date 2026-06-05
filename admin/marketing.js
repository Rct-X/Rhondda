// ======================================
// MARKETING MODULE (ESM SAFE)
// ======================================

export async function initMarketing({ db, auth }) {
  console.log("[MARKETING] init");

  // expose globals for inline HTML buttons
  window.addBusiness = addBusiness;
}

// ======================================
// ADD BUSINESS
// ======================================

async function addBusiness() {
  const name = document.getElementById("name")?.value?.trim();
  const email = document.getElementById("email")?.value?.trim();
  const phone = document.getElementById("phone")?.value?.trim();
  const town = document.getElementById("town")?.value?.trim();
  const category = document.getElementById("category")?.value;

  const result = document.getElementById("result");

  if (!name || !town || !category) {
    if (result) result.textContent = "Missing required fields";
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/adminAddBusiness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      const slug = name.toLowerCase().replace(/\s+/g, "-");

body: JSON.stringify({
  name,
  email,
  businessName: name,
  slug
})
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add business");
    }

    if (result) {
      result.textContent = "Business added successfully!";
    }

    // clear form
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("town").value = "";
    document.getElementById("category").value = "";

  } catch (err) {
    console.error("[MARKETING] error", err);

    if (result) {
      result.textContent = err.message;
    }
  }
}
