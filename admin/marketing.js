// ======================================
// MARKETING MODULE (MODULAR)
// ======================================

let db;
let auth;
let container;

export async function initMarketing({ db: _db, auth: _auth, container: _container }) {
  db = _db;
  auth = _auth;
  container = _container;

  console.log("[MARKETING] init");

  bindMarketingEvents();
}

// ======================================
// EVENT BINDING
// ======================================

function bindMarketingEvents() {
  const submitBtn = container.querySelector("#addBusinessBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      addBusiness();
    });
  }
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
// SMART DESCRIPTION GENERATOR
// ======================================

function generateDescription(name, category, town) {
  const cat = formatCategory(category);
  const lower = cat.toLowerCase();

  if (/(shop|store|retail|boutique|market|outlet)/i.test(lower)) {
    return `${name} is a trusted ${lower} located in ${town}. They offer quality products and friendly local service to customers across the area.`;
  }

  if (/(cafe|coffee|restaurant|takeaway|diner|grill|bar|pub|kitchen|pizza|burger)/i.test(lower)) {
    return `${name} is a popular ${lower} in ${town}, known for great food and a warm welcome. They proudly serve customers from across the local community.`;
  }

  if (/(salon|barber|beauty|spa|nails|aesthetics|massage|tan)/i.test(lower)) {
    return `${name} is a professional ${lower} based in ${town}, offering high-quality treatments and excellent customer care.`;
  }

  if (/(plumbing|electric|roof|builder|carpenter|joiner|handyman|landscape|clean|window|painter|decorator|heating|gas|boiler)/i.test(lower)) {
    return `${name} provides reliable ${lower} services in ${town} and surrounding areas, known for quality workmanship and dependable service.`;
  }

  if (/(accountant|insurance|consult|legal|finance|broker|advisor|agency)/i.test(lower)) {
    return `${name} offers professional ${lower} services in ${town}, supporting individuals and businesses with expert advice and personalised service.`;
  }

  if (/(charity|community|non-profit|support|centre|foundation)/i.test(lower)) {
    return `${name} is a valued community organisation in ${town}, providing support and services to local residents.`;
  }

  if (/(online|ecommerce|home|from home)/i.test(lower)) {
    return `${name} is a local ${lower} business serving customers in ${town} and beyond.`;
  }

  return `${name} provides ${lower} services in ${town} and the surrounding areas, offering reliable, friendly and professional service.`;
}

// ======================================
// ADD BUSINESS
// ======================================

async function addBusiness() {
  const name = container.querySelector("#name")?.value?.trim();
  const email = container.querySelector("#email")?.value?.trim();
  const phone = container.querySelector("#phone")?.value?.trim();
  const town = container.querySelector("#town")?.value?.trim();
  const category = container.querySelector("#category")?.value;
  const sendEmail = container.querySelector("#sendEmail")?.checked;

  const result = container.querySelector("#result");
  const submitBtn = container.querySelector("#addBusinessBtn");

  if (!result || !submitBtn) return;

  if (!name || !town || !category) {
    result.innerHTML = `<div class="status error">Please complete all required fields.</div>`;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Adding Business...";

  const slug = slugify(name);
  const townSlug = slugify(town);

  const description = generateDescription(name, category, town);

  try {
    const res = await fetch("/.netlify/functions/adminAddBusiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        town,
        category,
        slug,
        townSlug,
        sendEmail,
        source: "admin_seed",
        description
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to add business");
    }

    const listingUrl = `/directory/${category}/${townSlug}/${slug}`;
    const fullUrl = `${window.location.origin}${listingUrl}`;
    const googleSearch = `https://www.google.com/search?q=${encodeURIComponent(name + " " + town)}`;

    result.innerHTML = `
      <div class="status success">

        <strong>Business added successfully 🎉</strong>

        <p style="margin-top:8px;">
          Listing is now live in the directory.
        </p>

        <div class="result-actions">
          <a href="${listingUrl}" target="_blank" class="result-link">View Listing</a>
          <a href="${googleSearch}" target="_blank" class="result-link">Search Google</a>
          <button class="copy-btn">
            Copy Link
          </button>
        </div>

        <div class="link-preview">${fullUrl}</div>
        <div class="email-status">
          ${sendEmail ? "Email sent/scheduled ✉️" : "No email sent"}
        </div>

      </div>
    `;

    const copyBtn = result.querySelector(".copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(fullUrl);
      });
    }

    container.querySelector("#name").value = "";
    container.querySelector("#email").value = "";
    container.querySelector("#phone").value = "";
    container.querySelector("#town").value = "";
    container.querySelector("#category").value = "";

  } catch (err) {
    console.error("[MARKETING] error", err);

    result.innerHTML = `
      <div class="status error">${err.message}</div>
    `;

  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Business";
  }
}
