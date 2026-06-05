// ======================================
// MARKETING MODULE
// ======================================

export async function initMarketing({ db, auth }) {

  console.log("[MARKETING] init");

  window.addBusiness = addBusiness;
}

// ======================================
// SLUGIFY
// MUST MATCH MAIN DIRECTORY SYSTEM
// ======================================

function slugify(str) {

  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================================
// ADD BUSINESS
// ======================================

async function addBusiness() {

  const name =
    document.getElementById("name")
      ?.value
      ?.trim();

  const email =
    document.getElementById("email")
      ?.value
      ?.trim();

  const phone =
    document.getElementById("phone")
      ?.value
      ?.trim();

  const town =
    document.getElementById("town")
      ?.value
      ?.trim();

  const category =
    document.getElementById("category")
      ?.value;

  const result =
    document.getElementById("result");

  // ==========================
  // VALIDATION
  // ==========================

  if (!name || !town || !category) {

    if (result) {
      result.textContent =
        "Missing required fields";
    }

    return;
  }

  // ==========================
  // MATCH MAIN SITE SLUGS
  // ==========================

  const slug = slugify(name);

  try {

    const res = await fetch(
      "/.netlify/functions/adminAddBusiness",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          name,
          email,
          phone,
          town,
          category,
          slug
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {

      throw new Error(
        data.error || "Failed to add business"
      );
    }

    if (result) {

      result.textContent =
        "Business added successfully!";
    }

    // ==========================
    // CLEAR FORM
    // ==========================

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("town").value = "";
    document.getElementById("category").value = "";

  } catch (err) {

    console.error(
      "[MARKETING] error",
      err
    );

    if (result) {

      result.textContent =
        err.message;
    }
  }
}
