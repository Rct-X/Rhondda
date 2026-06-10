// ======================================
// SMART FINDER MODULE
// ======================================

console.log("[FINDER] Loaded");

window.findBusinesses = findBusinesses;
window.autoSeedBusiness = autoSeedBusiness;
window.refreshPlacesUsage = refreshPlacesUsage;

// ======================================
// FIND BUSINESSES
// ======================================

async function findBusinesses() {
  const category = document.getElementById("finderCategory")?.value?.trim();
  const town = document.getElementById("finderTown")?.value?.trim();
  const resultsBox = document.getElementById("finderResults");

  if (!category || !town) {
    resultsBox.innerHTML = `<div class="status error">Enter category and town.</div>`;
    return;
  }

  resultsBox.innerHTML = `<div class="status loading">Searching...</div>`;

  const query = `${category} ${town}`;

  try {
    const res = await fetch(
      `/.netlify/functions/placesProxy?query=${encodeURIComponent(query)}`
    );
    const json = await res.json();

    if (!json.ok) {
      resultsBox.innerHTML = `<div class="status error">Error: ${json.error}</div>`;
      return;
    }

    const results = json.data.results;

    if (!results || results.length === 0) {
      resultsBox.innerHTML = `<div class="status error">No businesses found.</div>`;
      return;
    }

    let html = `<div class="finder-list">`;

    for (const biz of results) {
      // ======================================
      // FETCH PLACE DETAILS (PHONE NUMBER)
      // ======================================

      let phone = "";
      try {
        const detailsRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?place_id=${biz.place_id}&fields=formatted_phone_number,international_phone_number,website&key=YOUR_API_KEY`
        );
        const details = await detailsRes.json();
        phone =
          details.result?.formatted_phone_number ||
          details.result?.international_phone_number ||
          "";
      } catch (err) {
        console.warn("Phone lookup failed", err);
      }

      // ======================================
      // EMAIL SCRAPING
      // ======================================

      let emailInfo = { emailFound: false, email: "", emailVerified: false, socialLinks: [] };

      if (biz.website) {
        try {
          emailInfo = await fetch("/.netlify/functions/emailScraper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: biz.website })
          }).then(r => r.json());
        } catch (err) {
          console.error("Email scrape failed", err);
        }
      }

      // ======================================
      // SCORING
      // ======================================

      let score = scoreBusiness(biz);
      if (!emailInfo.emailFound) score += 20;
      else score -= 10;

      html += `
        <div class="finder-item">
          <div class="finder-info">
            <strong>${biz.name}</strong><br>
            ${biz.formatted_address || ""}

            <div class="finder-meta">
              Website: ${biz.website ? "Yes" : "No"} |
              Reviews: ${biz.user_ratings_total || 0} |
              Phone: ${phone || "None"} |
              Email: ${emailInfo.emailFound ? emailInfo.email : "None"} |
              Verified: ${emailInfo.emailVerified ? "Yes" : "No"} |
              Social: ${emailInfo.socialLinks?.length || 0} |
              Score: <strong>${score}</strong>
            </div>
          </div>

          <button
            class="btn btn-small"
            onclick="autoSeedBusiness(
              '${biz.name.replace(/'/g, "\\'")}',
              '${town}',
              '${category}',
              ${score},
              '${emailInfo.email || ""}',
              '${phone || ""}'
            )"
          >
            Auto‑Add
          </button>
        </div>
      `;
    }

    html += `</div>`;
    resultsBox.innerHTML = html;

    refreshPlacesUsage();

  } catch (err) {
    console.error("[FINDER] Search error", err);
    resultsBox.innerHTML = `<div class="status error">Search failed.</div>`;
  }
}

// ======================================
// SCORING ENGINE
// ======================================

function scoreBusiness(biz) {
  let score = 0;

  if (!biz.website) score += 40;
  if (!biz.user_ratings_total) score += 30;
  if (!biz.opening_hours) score += 10;
  if (!biz.photos) score += 20;

  if (biz.user_ratings_total > 10) score -= 20;
  if (biz.website) score -= 40;

  return score;
}

// ======================================
// AUTO SEED BUSINESS
// ======================================

async function autoSeedBusiness(name, town, category, score, email = "", phone = "") {
  if (score < 50) {
    alert("This business has too strong an online presence. Skipped.");
    return;
  }

  const slug = slugify(name);
  const townSlug = slugify(town);
  const description = generateDescription(name, category, town);

  try {
    const res = await fetch("/.netlify/functions/adminAddBusiness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        town,
        category,
        slug,
        townSlug,
        email,
        phone,
        sendEmail: true,
        source: "smart_seed",
        description
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert("Error: " + data.error);
      return;
    }

    alert(`Added: ${name}`);

  } catch (err) {
    console.error("[FINDER] Auto seed error", err);
    alert("Failed to add business.");
  }
}

// ======================================
// USAGE WIDGET
// ======================================

async function refreshPlacesUsage() {
  const box = document.getElementById("placesUsageBox");
  if (!box) return;

  try {
    const res = await fetch("/.netlify/functions/getPlacesUsage");
    const json = await res.json();

    if (!json.ok) {
      box.innerHTML = `<div class="status error">Error loading usage.</div>`;
      return;
    }

    const { today, total, avg7, resetTime } = json;

    box.innerHTML = `
      <div class="usage-stats">
        <p><strong>Today:</strong> ${today} searches</p>
        <p><strong>Total:</strong> ${total} searches</p>
        <p><strong>7‑day avg:</strong> ${(avg7 || 0).toFixed(1)} / day</p>
        <p><strong>Daily reset:</strong> ${resetTime}</p>
      </div>
    `;
  } catch (err) {
    console.error("[FINDER] Usage widget error", err);
    box.innerHTML = `<div class="status error">Error loading usage.</div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshPlacesUsage();
});
