// ======================================
// SMART FINDER MODULE
// ======================================

console.log("[FINDER] Loaded");

// Make functions available globally
window.findBusinesses = findBusinesses;
window.autoSeedBusiness = autoSeedBusiness;
window.refreshPlacesUsage = refreshPlacesUsage;

// ======================================
// FIND BUSINESSES (via Netlify Proxy)
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
      resultsBox.innerHTML = `<div class="status error">Error: ${json.error || "Failed to search"}</div>`;
      return;
    }

    const data = json.data;

    if (!data.results || data.results.length === 0) {
      resultsBox.innerHTML = `<div class="status error">No businesses found.</div>`;
      return;
    }

    let html = `<div class="finder-list">`;

    for (const biz of data.results) {
      const score = scoreBusiness(biz);

      html += `
        <div class="finder-item">
          <div class="finder-info">
            <strong>${biz.name}</strong><br>
            ${biz.formatted_address || ""}
            <div class="finder-meta">
              Website: ${biz.website ? "Yes" : "No"} |
              Reviews: ${biz.user_ratings_total || 0} |
              Score: <strong>${score}</strong>
            </div>
          </div>

          <button
            class="btn btn-small"
            onclick="autoSeedBusiness('${biz.name.replace(/'/g, "\\'")}', '${town}', '${category}', ${score})"
          >
            Auto‑Add
          </button>
        </div>
      `;
    }

    html += `</div>`;
    resultsBox.innerHTML = html;

    // Refresh usage widget after each search
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

async function autoSeedBusiness(name, town, category, score) {
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
        email: "",
        phone: "",
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

// Auto-load usage on admin open
document.addEventListener("DOMContentLoaded", () => {
  refreshPlacesUsage();
});
