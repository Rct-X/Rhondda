// ======================================
// ADMIN PANEL (FULLY MODULAR ROUTER)
// ======================================

let auth = null;
let db = null;

// ======================================
// FIREBASE INIT
// ======================================

async function initFirebase() {
  const res = await fetch("/.netlify/functions/firebaseConfig");

  if (!res.ok) throw new Error("Firebase config failed");

  const config = await res.json();

  if (!firebase.apps.length) {
    firebase.initializeApp(config);
  }

  return {
    auth: firebase.auth(),
    db: firebase.firestore()
  };
}

// ======================================
// DOM ELEMENTS
// ======================================

const loginSection = document.getElementById("loginSection");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

const adminContainer = document.getElementById("adminContainer"); 
// (wrap all admin sections inside this div)

// ======================================
// ROUTER MAP
// ======================================

const ROUTES = {
  dashboard: async () => {
    const mod = await import("./moderation.js");
    await mod.initModeration({ db, auth, container: document.getElementById("dashboardTab") });

    const pending = await import("./pending.js");
    await pending.initPending({ db, auth });
  },

  marketing: async () => {
    const marketing = await import("./marketing.js");
    await marketing.initMarketing({
      db,
      auth,
      container: document.getElementById("marketingSection")
    });

    const finder = await import("./finder.js");
    if (finder.initFinder) {
      finder.initFinder({
        db,
        auth,
        container: document.getElementById("marketingSection")
      });
    }
  },

  businesses: async () => {
    const bm = await import("./business-manager.js");
    await bm.initBusinessManager({ db, auth });
  }
};

// ======================================
// INIT APP
// ======================================

(async () => {
  try {
    const services = await initFirebase();
    auth = services.auth;
    db = services.db;

    setupAuth();
    setupSidebarNavigation();

  } catch (err) {
    console.error(err);
    if (loginMessage) loginMessage.textContent = "System error";
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

    await navigateTo("dashboard");
  });
}

// ======================================
// SIDEBAR NAVIGATION (EVENT DELEGATION)
// ======================================

function setupSidebarNavigation() {
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".admin-tab");
    if (!btn) return;

    const tab = btn.dataset.tab;
    if (!tab) return;

    await navigateTo(tab.replace("Tab", "").toLowerCase());
  });
}

// ======================================
// ROUTER
// ======================================

async function navigateTo(section) {
  hideAllSections();
  setActiveTab(section + "Tab");

  const target =
    document.getElementById(section + "Tab") ||
    document.getElementById(section + "Section");

  if (target) target.style.display = "block";

  if (ROUTES[section]) {
    await ROUTES[section]();
  }
}

// ======================================
// HELPERS
// ======================================

function hideAllSections() {
  adminContainer
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
