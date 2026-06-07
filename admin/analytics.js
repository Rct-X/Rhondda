let RANGE = 30;

// =========================
// INIT
// =========================

export async function initAnalytics({ auth }) {

  console.log("[ANALYTICS] init");

  window.setRange = setRange;
  window.deleteAnalyticsRange = deleteAnalyticsRange;
  window.deleteAllAnalytics = deleteAllAnalytics;

  setActiveFilterButton(RANGE);

  await loadAnalytics(auth);
}

// =========================
// BUTTON UI
// =========================

function setActiveFilterButton(days) {

  document.querySelectorAll(".filters button")
    .forEach(b => b.classList.remove("active"));

  document.getElementById("f" + days)
    ?.classList.add("active");
}

function setRange(days) {
  RANGE = days;
  setActiveFilterButton(days);
  renderDashboard(window.__visits || []);
}

// =========================
// TIMESTAMP NORMALISER
// =========================

function getTimestamp(v) {

  if (typeof v?.ts === "number") return v.ts;

  if (v?.timestamp?.toMillis) return v.timestamp.toMillis();

  if (v?.timestamp?._seconds) return v.timestamp._seconds * 1000;

  return 0;
}

// =========================
// DEVICE NORMALISER
// =========================

function normaliseDevice(device) {

  if (!device) return "Unknown";

  const d = device.toLowerCase();

  if (d.includes("mobile")) return "Mobile";
  if (d.includes("desktop")) return "Desktop";
  if (d.includes("tablet")) return "Tablet";

  return "Other";
}

// =========================
// SOURCE DETECTION
// =========================

function detectSource(referrer) {

  if (!referrer || referrer === "direct") return "Direct";

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

// =========================
// FILTER BY DATE
// =========================

function filterByDate(visits, days) {

  const now = Date.now();

  return visits.filter(v => {
    const t = getTimestamp(v);
    return t && (now - t <= days * 86400000);
  });
}

// =========================
// MAIN RENDER
// =========================

function renderDashboard(visits) {

  visits = filterByDate(visits, RANGE);

  const clients = {};

  // GLOBAL DEVICE COUNTERS
  let global = {
    total: 0,
    mobile: 0,
    desktop: 0,
    tablet: 0,
    other: 0
  };

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
    global.total++;

    // DEVICE
    const device = normaliseDevice(v.device);

    if (device === "Mobile") { client.mobile++; global.mobile++; }
    if (device === "Desktop") { client.desktop++; global.desktop++; }
    if (device === "Tablet") { client.tablet++; global.tablet++; }
    if (device === "Other") { client.other++; global.other++; }

    // PAGE
    const page = v.page || "/";
    client.pages[page] = (client.pages[page] || 0) + 1;

    // SOURCE
    const source = detectSource(v.referrer);
    client.sources[source] = (client.sources[source] || 0) + 1;

    // EVENTS
    if (v.event === "whatsapp_click") client.events.whatsapp++;
    if (v.event === "phone_tap") client.events.phone++;
    if (v.event === "form_submit") client.events.form++;
  });

  // UPDATE TOP STATS
  const totalVisitsEl = document.getElementById("totalVisits");
  const totalClientsEl = document.getElementById("totalClients");

  if (totalVisitsEl) totalVisitsEl.innerText = visits.length;
  if (totalClientsEl) totalClientsEl.innerText = Object.keys(clients).length;

  // RENDER CLIENTS
  const wrap = document.getElementById("clients");
  if (!wrap) return;

  wrap.innerHTML = "";

  Object.entries(clients)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([id, data]) => {

      const mobilePercent = data.total
        ? Math.round((data.mobile / data.total) * 100)
        : 0;

      const topPage =
        Object.entries(data.pages)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "/";

      wrap.innerHTML += `
        <div class="client-card">

          <h3>${id}</h3>

          <p>${data.total} visits</p>

          <p>
            📱 ${data.mobile} mobile |
            💻 ${data.desktop} desktop |
            📟 ${data.tablet} tablet |
            ❓ ${data.other} other
          </p>

          <p>Mobile: ${mobilePercent}%</p>

          <p>Top page: ${topPage}</p>

          <p>WhatsApp: ${data.events.whatsapp}</p>
          <p>Phone: ${data.events.phone}</p>
          <p>Forms: ${data.events.form}</p>

        </div>
      `;
    });

  console.log("[ANALYTICS] global:", global);
}

// =========================
// LOAD DATA
// =========================

async function loadAnalytics(auth) {

  try {

    const token = await auth.currentUser.getIdToken();

    const res = await fetch("/.netlify/functions/getAnalytics", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error("Failed load");

    const visits = await res.json();

    window.__visits = visits;

    renderDashboard(visits);

  } catch (err) {

    console.error("[ANALYTICS]", err);

    const wrap = document.getElementById("clients");
    if (wrap) {
      wrap.innerHTML = "<p>Failed to load analytics</p>";
    }
  }
}

// =========================
// PLACEHOLDERS
// =========================

async function deleteAnalyticsRange() {}
async function deleteAllAnalytics() {}
