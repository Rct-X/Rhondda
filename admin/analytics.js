// ======================================
// ANALYTICS.JS (FIXED + NORMALISED)
// ======================================

let RANGE = 30;

// ======================================
// INIT
// ======================================

export async function initAnalytics({ auth }) {

  console.log("[ANALYTICS] Initialising analytics module");

  window.setRange = setRange;
  window.deleteAnalyticsRange = deleteAnalyticsRange;
  window.deleteAllAnalytics = deleteAllAnalytics;

  setActiveFilterButton(RANGE);

  await loadAnalytics(auth);
}

// ======================================
// FILTER BUTTON UI
// ======================================

function setActiveFilterButton(days) {

  document.querySelectorAll(".filters button")
    .forEach(btn => btn.classList.remove("active"));

  const activeBtn = document.getElementById("f" + days);

  if (activeBtn) activeBtn.classList.add("active");
}

function setRange(days) {
  RANGE = days;
  setActiveFilterButton(days);
  renderDashboard(window.__visits || []);
}

// ======================================
// NORMALISATION HELPERS
// ======================================

function getTimestamp(v) {

  if (v?.ts) return v.ts;

  if (v?.timestamp?.toMillis) {
    return v.timestamp.toMillis();
  }

  if (v?.timestamp?._seconds) {
    return v.timestamp._seconds * 1000;
  }

  return 0;
}

function normaliseDevice(device) {

  if (!device) return "Unknown";

  const d = device.toLowerCase();

  if (d.includes("mobile")) return "Mobile";
  if (d.includes("desktop")) return "Desktop";
  if (d.includes("tablet")) return "Tablet";

  return "Other";
}

function detectSource(referrer) {

  if (!referrer || referrer === "direct") {
    return "Direct";
  }

  const r = referrer.toLowerCase();

  if (r.includes("google")) return "Google";
  if (r.includes("facebook")) return "Facebook";
  if (r.includes("instagram")) return "Instagram";
  if (r.includes("tiktok")) return "TikTok";
  if (r.includes("linkedin")) return "LinkedIn";
  if (r.includes("twitter") || r.includes("x.com")) return "X / Twitter";
  if (r.includes("whatsapp")) return "WhatsApp";
  if (r.includes("rctx.co.uk")) return "RCTX Website";

  return "Other";
}

// ======================================
// DATE FILTER
// ======================================

function filterByDate(visits, days) {

  const now = Date.now();

  return visits.filter(v => {

    const t = getTimestamp(v);

    if (!t) return false;

    return now - t <= days * 86400000;
  });
}

// ======================================
// RENDER DASHBOARD
// ======================================

function renderDashboard(visits) {

  visits = filterByDate(visits, RANGE);

  // ----------------------
  // TOTAL VISITS
  // ----------------------

  const totalVisits = document.getElementById("totalVisits");
  if (totalVisits) {
    totalVisits.innerText = visits.length;
  }

  // ----------------------
  // CLIENT AGGREGATION
  // ----------------------

  const clients = {};

  visits.forEach(v => {

    const clientId = v.clientId || "unknown";

    if (!clients[clientId]) {

      clients[clientId] = {
        total: 0,
        mobile: 0,
        desktop: 0,
        tablet: 0,
        other: 0,
        pages: {},
        sources: {},
        events: {
          whatsapp: 0,
          phone: 0,
          form: 0
        }
      };
    }

    const client = clients[clientId];

    client.total++;

    // ----------------------
    // DEVICE
    // ----------------------

    const device = normaliseDevice(v.device);

    if (device === "Mobile") client.mobile++;
    if (device === "Desktop") client.desktop++;
    if (device === "Tablet") client.tablet++;
    if (device === "Other") client.other++;

    // ----------------------
    // PAGES
    // ----------------------

    const page = v.page || "/";
    client.pages[page] = (client.pages[page] || 0) + 1;

    // ----------------------
    // SOURCES
    // ----------------------

    const source = detectSource(v.referrer);
    client.sources[source] = (client.sources[source] || 0) + 1;

    // ----------------------
    // EVENTS
    // ----------------------

    if (v.event === "whatsapp_click") client.events.whatsapp++;
    if (v.event === "phone_tap") client.events.phone++;
    if (v.event === "form_submit") client.events.form++;

  });

  // ----------------------
  // TOTAL CLIENTS
  // ----------------------

  const totalClients = document.getElementById("totalClients");

  if (totalClients) {
    totalClients.innerText = Object.keys(clients).length;
  }

  // ----------------------
  // RENDER CLIENT CARDS
  // ----------------------

  const wrap = document.getElementById("clients");

  if (!wrap) return;

  wrap.innerHTML = "";

  Object.entries(clients)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([name, data]) => {

      const topPage =
        Object.entries(data.pages)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "/";

      const mobilePercent = data.total
        ? Math.round((data.mobile / data.total) * 100)
        : 0;

      const topSources =
        Object.entries(data.sources)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([src, count]) => `
            <li>${src}: ${count}</li>
          `)
          .join("");

      wrap.innerHTML += `
        <div class="client-card">

          <h3>${name}</h3>

          <div class="stat">
            ${data.total} visits
          </div>

          <div class="stat">
            Device: ${mobilePercent}% mobile
          </div>

          <div class="stat">
            Mobile: ${data.mobile} |
            Desktop: ${data.desktop} |
            Tablet: ${data.tablet} |
            Other: ${data.other}
          </div>

          <div class="stat">
            Top page: ${topPage}
          </div>

          <div class="stat">
            WhatsApp: ${data.events.whatsapp}
          </div>

          <div class="stat">
            Phone: ${data.events.phone}
          </div>

          <div class="stat">
            Forms: ${data.events.form}
          </div>

          <div class="stat">Top sources:</div>

          <ul class="small">
            ${topSources}
          </ul>

        </div>
      `;
    });
}

// ======================================
// LOAD ANALYTICS
// ======================================

async function loadAnalytics(auth) {

  try {

    console.log("[ANALYTICS] Loading analytics");

    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/getAnalytics", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Failed loading analytics");
    }

    const visits = await res.json();

    console.log("[ANALYTICS] Loaded:", visits.length);

    window.__visits = visits;

    renderDashboard(visits);

  } catch (err) {

    console.error("[ANALYTICS] Error:", err);

    const wrap = document.getElementById("clients");
    if (wrap) {
      wrap.innerHTML = `<p>Failed to load analytics.</p>`;
    }
  }
}

// ======================================
// DELETE RANGE
// ======================================

async function deleteAnalyticsRange() {

  const start = document.getElementById("analyticsStart")?.value;
  const end = document.getElementById("analyticsEnd")?.value;

  if (!start || !end) {
    alert("Please select start and end dates");
    return;
  }

  if (!confirm(`Delete analytics from ${start} to ${end}?`)) return;

  try {

    const token = await firebase.auth().currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/deleteAnalyticsRange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ start, end })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert(data.message || "Deleted");

    await loadAnalytics(firebase.auth());

  } catch (err) {
    console.error(err);
    alert(err.message || "Delete failed");
  }
}

// ======================================
// DELETE ALL
// ======================================

async function deleteAllAnalytics() {

  if (!confirm("Delete ALL analytics permanently?")) return;

  try {

    const token = await firebase.auth().currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/deleteAnalyticsRange", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ all: true })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Delete failed");

    alert(data.message || "Deleted");

    window.__visits = [];
    renderDashboard([]);

  } catch (err) {
    console.error(err);
    alert(err.message || "Delete failed");
  }
}
