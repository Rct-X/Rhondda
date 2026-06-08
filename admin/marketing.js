// ======================================
// MARKETING MODULE
// ======================================

export async function initMarketing({ db, auth }) {

  console.log("[MARKETING] init");

  window.addBusiness = addBusiness;
}

// ======================================
// SLUGIFY
// ======================================

function slugify(str = "") {

  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================================
// FORMAT CATEGORY
// ======================================

function formatCategory(category = "") {

  return category
    .replace(/-/g, " ")
    .replace(/\b\w/g, l => l.toUpperCase());
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

  const sendEmail =
    document.getElementById("sendEmail")
      ?.checked;

  const result =
    document.getElementById("result");

  const submitBtn =
    document.getElementById("addBusinessBtn");

  // ======================================
  // VALIDATION
  // ======================================

  if (!name || !town || !category) {

    result.innerHTML = `
      <div class="status error">
        Please complete all required fields.
      </div>
    `;

    return;
  }

  // ======================================
  // LOADING STATE
  // ======================================

  submitBtn.disabled = true;

  submitBtn.textContent =
    "Adding Business...";

  // ======================================
  // SLUGS
  // ======================================

  const slug = slugify(name);

  const townSlug =
    slugify(town);

  // ======================================
  // SEO DESCRIPTION
  // ======================================

  const description = `
${name} provides ${formatCategory(category)}
services in ${town} and surrounding areas.
Contact them for local quotes and availability.
`;

  try {

    // ======================================
    // API REQUEST
    // ======================================

    const res = await fetch(
      "/.netlify/functions/adminAddBusiness",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          name,
          email,
          phone,
          town,

          category,

          slug,
          townSlug,

          sendEmail,

          source:
            "admin_seed",

          description

        })
      }
    );

    const data =
      await res.json();

    if (!res.ok) {

      throw new Error(
        data.error ||
        "Failed to add business"
      );
    }

    // ======================================
    // URLS
    // ======================================

    const listingUrl =
      `/directory/${category}/${townSlug}/${slug}`;

    const fullUrl =
      `${window.location.origin}${listingUrl}`;

    const googleSearch =
      `https://www.google.com/search?q=${encodeURIComponent(name + " " + town)}`;

    // ======================================
    // SUCCESS UI
    // ======================================

result.innerHTML = `
  <div class="status success">

    <strong>Business added successfully 🎉</strong>

    <p style="margin-top:8px;">
      Listing has been created and is now live in the directory.
    </p>

    <div class="result-actions">

      <a
        href="${listingUrl}"
        target="_blank"
        class="result-link"
      >
        View Listing
      </a>

      <a
        href="${googleSearch}"
        target="_blank"
        class="result-link"
      >
        Search on Google
      </a>

      <button
        class="copy-btn"
        onclick="navigator.clipboard.writeText('${fullUrl}')"
      >
        Copy Link
      </button>

    </div>

    <div class="link-preview">
      ${fullUrl}
    </div>

    <div class="email-status">
      ${sendEmail ? "Email sent/scheduled ✉️" : "No email sent"}
    </div>

  </div>
`;

    // ======================================
    // CLEAR FORM
    // ======================================

    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("town").value = "";
    document.getElementById("category").value = "";

    // ======================================
    // OPEN LISTING
    // ======================================

  } catch (err) {

    console.error(
      "[MARKETING] error",
      err
    );

    result.innerHTML = `
      <div class="status error">
        ${err.message}
      </div>
    `;

  } finally {

    submitBtn.disabled = false;

    submitBtn.textContent =
      "Add Business";
  }
}
