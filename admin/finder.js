async function findBusinesses() {
  const category = document.getElementById("finderCategory").value.trim();
  const town = document.getElementById("finderTown").value.trim();
  const resultsBox = document.getElementById("finderResults");

  if (!category || !town) {
    resultsBox.innerHTML = `<div class="status error">Enter category and town.</div>`;
    return;
  }

  resultsBox.innerHTML = `<div class="status loading">Searching...</div>`;

  const query = `${category} ${town}`;

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

  // also refresh usage widget after each search
  if (window.refreshPlacesUsage) {
    window.refreshPlacesUsage();
  }
}
