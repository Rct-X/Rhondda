// ======================================
// FIREBASE INIT
// ======================================

async function initFirebase() {

  const res = await fetch("/.netlify/functions/firebaseConfig");

  if (!res.ok) {
    throw new Error("Firebase config failed");
  }

  const config = await res.json();

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  return {
    auth: firebase.auth(),
    db: firebase.firestore()
  };
}

window.db = null;
window.auth = null;

// ======================================
// ELEMENTS
// ======================================

const loginSection = document.getElementById("loginSection");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

// ======================================
// INIT APP
// ======================================

(async () => {

  try {

    const services = await initFirebase();

    window.auth = services.auth;
    window.db = services.db;

    setupAuth();
    setupSidebarNavigation();

  } catch (err) {

    console.error(err);

    if (loginMessage) {
      loginMessage.textContent = "System error";
    }
  }

})();

// ======================================
// AUTH
// ======================================

function setupAuth() {

  loginBtn?.addEventListener("click", async () => {

    const email = document.getElementById("adminEmail")?.value?.trim();
    const password = document.getElementById("adminPassword")?.value?.trim();

    loginMessage.textContent = "";

    try {

      await auth.signInWithEmailAndPassword(email, password);

    } catch (err) {

      console.error(err);
      loginMessage.textContent = "Invalid login";
    }
  });

  auth.onAuthStateChanged(async (user) => {

    if (!user) {
      loginSection.style.display = "block";
      hideAllSections();
      return;
    }

    loginSection.style.display = "none";

    await openSection("dashboard");
    setActiveTab("dashboardTab");
  });
}

// ======================================
// TAB UI HELPERS
// ======================================

function hideAllSections() {

  document
    .querySelectorAll(".admin-panel, .admin-panel-section")
    .forEach(section => {
      section.style.display = "none";
    });
}

function setActiveTab(tabId) {

  document
    .querySelectorAll(".admin-tab")
    .forEach(btn => btn.classList.remove("active"));

  document
    .querySelector(`[data-tab="${tabId}"]`)
    ?.classList.add("active");
}

// ======================================
// SIDEBAR NAVIGATION
// ======================================

function setupSidebarNavigation() {

  document.querySelectorAll(".admin-tab").forEach(btn => {

    btn.addEventListener("click", async () => {

      const tab = btn.dataset.tab;
      if (!tab) return;

      setActiveTab(tab);

      const section = tab
        .replace("Tab", "")
        .replace("tab", "")
        .toLowerCase();

      await openSection(section);
    });
  });
}

// ======================================
// ROUTER
// ======================================

window.openSection = async function (section) {

  hideAllSections();

  const target =
    document.getElementById(section + "Tab") ||
    document.getElementById(section + "Section");

  if (target) {
    target.style.display = "block";
  }

  // ===========================
  // DASHBOARD (MODERATION ONLY)
  // ===========================

  if (section === "dashboard") {

    const mod = await import("./moderation.js");

    await mod.initModeration({
      db: window.db,
      auth: window.auth
    });
  }

  // ===========================
  // MARKETING
  // ===========================

  if (section === "marketing") {

  const marketing = await import("./marketing.js");

  await marketing.initMarketing({
    db: window.db,
    auth: window.auth
  });

  const finder = await import("./finder.js");

  finder.initFinder?.(); // 👈 important
  }
