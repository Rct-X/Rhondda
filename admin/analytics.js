// ======================================
// ANALYTICS.JS
// Lazy-loaded analytics module
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

  // Default active button
  setActiveFilterButton(RANGE);

  // Load analytics
  await loadAnalytics(auth);
}

// ======================================
// FILTER BUTTONS
// ======================================

function setActiveFilterButton(days){

  document
    .querySelectorAll(".filters button")
    .forEach(btn => {
      btn.classList.remove("active");
    });

  const activeBtn =
    document.getElementById("f" + days);

  if(activeBtn){
    activeBtn.classList.add("active");
  }
}

function setRange(days){

  RANGE = days;

  setActiveFilterButton(days);

  renderDashboard(window.__visits || []);
}

// ======================================
// SOURCE DETECTION
// ======================================

function detectSource(referrer){

  if(!referrer || referrer === "direct"){
    return "Direct";
  }

  const r = referrer.toLowerCase();

  if(r.includes("google")) return "Google";
  if(r.includes("facebook")) return "Facebook";
  if(r.includes("instagram")) return "Instagram";
  if(r.includes("tiktok")) return "TikTok";
  if(r.includes("linkedin")) return "LinkedIn";
  if(r.includes("twitter")) return "X / Twitter";
  if(r.includes("x.com")) return "X / Twitter";
  if(r.includes("whatsapp")) return "WhatsApp";
  if(r.includes("rctx.co.uk")) return "RCTX Website";

  return "Other";
}

// ======================================
// DATE FILTERING
// ======================================

function filterByDate(visits, days){

  const now = Date.now();

  return visits.filter(v => {

    if(!v.timestamp){
      return false;
    }

    return (
      now - v.timestamp <= days * 86400000
    );
  });
}

// ======================================
// RENDER DASHBOARD
// ======================================

function renderDashboard(visits){

  visits = filterByDate(visits, RANGE);

  // ==========================
  // TOTAL VISITS
  // ==========================

  const totalVisits =
    document.getElementById("totalVisits");

  if(totalVisits){
    totalVisits.innerText = visits.length;
  }

  // ==========================
  // CLIENT AGGREGATION
  // ==========================

  const clients = {};

  visits.forEach(v => {

    const clientId =
      v.clientId || "unknown";

    if(!clients[clientId]){

      clients[clientId] = {
        total: 0,
        mobile: 0,
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

    // Device
    if(v.device === "Mobile"){
      client.mobile++;
    }

    // Page
    const page = v.page || "/";

    client.pages[page] =
      (client.pages[page] || 0) + 1;

    // Source
    const source =
      detectSource(v.referrer);

    client.sources[source] =
      (client.sources[source] || 0) + 1;

    // Events
    if(v.event === "whatsapp_click"){
      client.events.whatsapp++;
    }

    if(v.event === "phone_tap"){
      client.events.phone++;
    }

    if(v.event === "form_submit"){
      client.events.form++;
    }

  });

  // ==========================
  // TOTAL CLIENTS
  // ==========================

  const totalClients =
    document.getElementById("totalClients");

  if(totalClients){
    totalClients.innerText =
      Object.keys(clients).length;
  }

  // ==========================
  // CLIENT CARDS
  // ==========================

  const wrap =
    document.getElementById("clients");

  if(!wrap){
    return;
  }

  wrap.innerHTML = "";

  Object.entries(clients)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([name, data]) => {

      const topPage =
        Object.entries(data.pages)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "/";

      const mobilePercent =
        data.total
          ? Math.round(
              (data.mobile / data.total) * 100
            )
          : 0;

      const topSources =
        Object.entries(data.sources)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([source, count]) => `
            <li>
              ${source}
              <span>${count}</span>
            </li>
          `)
          .join("");

      wrap.innerHTML += `
        <div class="client-card">

          <div class="client-top">

            <div>
              <h3>${name}</h3>
              <p>${data.total} visits</p>
            </div>

            <div class="client-badge">
              ${mobilePercent}% mobile
            </div>

          </div>

          <div class="client-stats">

            <div class="stat-box">
              <span>Top Page</span>
              <strong>${topPage}</strong>
            </div>

            <div class="stat-box">
              <span>WhatsApp</span>
              <strong>${data.events.whatsapp}</strong>
            </div>

            <div class="stat-box">
              <span>Phone</span>
              <strong>${data.events.phone}</strong>
            </div>

            <div class="stat-box">
              <span>Forms</span>
              <strong>${data.events.form}</strong>
            </div>

          </div>

          <div class="traffic-sources">

            <h4>Traffic Sources</h4>

            <ul>
              ${topSources}
            </ul>

          </div>

        </div>
      `;
    });
}

// ======================================
// LOAD ANALYTICS
// ======================================

async function loadAnalytics(auth){

  try{

    console.log("[ANALYTICS] Loading analytics");

    const token =
      await auth.currentUser.getIdToken();

    const res = await fetch(
      "/.netlify/functions/getAnalytics",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if(!res.ok){

      throw new Error(
        "Failed loading analytics"
      );
    }

    const visits = await res.json();

    console.log(
      "[ANALYTICS] Loaded:",
      visits.length
    );

    window.__visits = visits;

    renderDashboard(visits);

  } catch(err){

    console.error(
      "[ANALYTICS] Error:",
      err
    );

    const clients =
      document.getElementById("clients");

    if(clients){

      clients.innerHTML = `
        <p>
          Failed to load analytics.
        </p>
      `;
    }
  }
}

// ======================================
// DELETE RANGE
// ======================================

async function deleteAnalyticsRange(){

  const start =
    document.getElementById("analyticsStart")?.value;

  const end =
    document.getElementById("analyticsEnd")?.value;

  if(!start || !end){

    alert(
      "Please select start and end dates"
    );

    return;
  }

  if(
    !confirm(
      `Delete analytics from ${start} to ${end}?`
    )
  ){
    return;
  }

  try{

    const token =
      await firebase
        .auth()
        .currentUser
        .getIdToken();

    const res = await fetch(
      "/.netlify/functions/deleteAnalyticsRange",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          start,
          end
        })
      }
    );

    const data = await res.json();

    if(!res.ok){

      throw new Error(
        data.error || "Delete failed"
      );
    }

    alert(data.message || "Deleted");

    await loadAnalytics(firebase.auth());

  } catch(err){

    console.error(err);

    alert(
      err.message || "Delete failed"
    );
  }
}

// ======================================
// DELETE ALL
// ======================================

async function deleteAllAnalytics(){

  if(
    !confirm(
      "Delete ALL analytics permanently?"
    )
  ){
    return;
  }

  try{

    const token =
      await firebase
        .auth()
        .currentUser
        .getIdToken();

    const res = await fetch(
      "/.netlify/functions/deleteAnalyticsRange",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },

        body: JSON.stringify({
          all: true
        })
      }
    );

    const data = await res.json();

    if(!res.ok){

      throw new Error(
        data.error || "Delete failed"
      );
    }

    alert(data.message || "Deleted");

    window.__visits = [];

    renderDashboard([]);

  } catch(err){

    console.error(err);

    alert(
      err.message || "Delete failed"
    );
  }
                }
