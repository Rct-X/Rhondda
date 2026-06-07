let RANGE = 30;

// =========================
// INIT
// =========================

export async function initAnalytics({ auth }) {

  window.setRange = setRange;
  window.deleteAnalyticsRange = deleteAnalyticsRange;
  window.deleteAllAnalytics = deleteAllAnalytics;

  setActiveFilterButton(RANGE);
  await loadAnalytics(auth);
}

// =========================
// UI
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
// TIMESTAMP FIX (CRITICAL)
// =========================

function getTimestamp(v) {

  if (typeof v?.ts === "number") return v.ts;

  if (v?.timestamp?.toMillis) return v.timestamp.toMillis();

  if (v?.timestamp?._seconds) return v.timestamp._seconds * 1000;

  return 0;
}

// =========================
// DEVICE NORMALISATION
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
// FILTER
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

  // =====================
  // GLOBAL STATS (NEW)
  // =====================

  let global = {
    total: visits.length,
    mobile: 0,
    desktop: 0,
    tablet: 0,
    other: 0
  };

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

    const device = normaliseDevice(v.device);

    if (device === "Mobile") {
      client.mobile++;
      global.mobile++;
    }

    if (device === "Desktop") {
      client.desktop++;
      global.desktop++;
    }

    if (device === "Tablet") {
      client.tablet++;
      global.tablet++;
    }

    if (device === "Other") {
      client.other++;
      global.other++;
    }

    const page = v.page || "/";
    client.pages[page] = (client.pages[page] || 0) + 1;

    const source = detectSource(v.referrer);
    client.sources[source] = (client.sources[source] || 0) + 1;

    if (v.event === "whatsapp_click") client.events.whatsapp++;
    if (v.event === "phone_tap") client.events.phone++;
    if (v.event === "form_submit") client.events.form++;

  });

  // =====================
  // UPDATE GLOBAL UI
  // =====================

  document.getElementById("totalVisits").innerText = visits.length;
  document.getElementById("totalClients").innerText = Object.keys(clients).length;

  // =====================
  // CLIENT RENDER
  // =====================

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

          <p>Mobile %: ${mobilePercent}%</p>

          <p>Top page: ${topPage}</p>

          <p>WhatsApp: ${data.events.whatsapp}</p>
          <p>Phone: ${data.events.phone}</p>
          <p>Forms: ${data.events.form}</p>

        </div>
      `;
    });

  console.log("[ANALYTICS] Global device split:", global);
}
