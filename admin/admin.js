// ===============================
// FIREBASE INIT
// ===============================

async function initFirebase() {

  const res = await fetch(
    "/.netlify/functions/firebaseConfig"
  );

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

// ===============================
// ELEMENTS
// ===============================

const loginSection =
  document.getElementById("loginSection");

const loginBtn =
  document.getElementById("loginBtn");

const loginMessage =
  document.getElementById("loginMessage");

// ===============================
// INIT APP
// ===============================

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

// ===============================
// AUTH
// ===============================

function setupAuth() {

  loginBtn?.addEventListener("click", async () => {

    const email =
      document.getElementById("adminEmail")?.value?.trim();

    const password =
      document.getElementById("adminPassword")?.value?.trim();

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

    // default load AFTER auth is confirmed
    await openSection("dashboard");
  });
}

document.querySelectorAll(".admin-tab").forEach(b => {
  b.classList.remove("active");
});

document
  .querySelector('[data-tab="dashboardTab"]')
  ?.classList.add("active");

// ===============================
// SECTION ROUTER
// ===============================

function hideAllSections() {

  document.querySelectorAll(".admin-tab").forEach(b => {
  b.classList.remove("active");
});

document
  .querySelector('[data-tab="dashboardTab"]')
  ?.classList.add("active");
    .forEach(section => {
      section.style.display = "none";
    });
}

window.openSection = async function (section) {

  hideAllSections();

  const target =
    document.getElementById(section + "Section") ||
    document.getElementById(section + "Tab");

  if (target) {
    target.style.display = "block";
  }

  // ===============================
  // DASHBOARD / MODERATION
  // ===============================
  if (section === "dashboard") {

    const mod = await import("./moderation.js");

    await mod.initModeration({
      db: window.db,
      auth: window.auth
    });
  }

  // ===============================
  // ANALYTICS
  // ===============================
  if (section === "analytics") {

    const analytics = await import("./analytics.js");

    await analytics.initAnalytics({
      auth: window.auth
    });
  }

  // ===============================
  // MARKETING
  // ===============================
  if (section === "marketing") {

    await import("./marketing.js");
  }
};

function setupSidebarNavigation() {

  document.querySelectorAll(".admin-tab").forEach(btn => {

    btn.addEventListener("click", async () => {

      const tab = btn.dataset.tab;

      if (!tab) return;

      // remove active state
      document.querySelectorAll(".admin-tab")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      // convert:
      // dashboardTab → dashboard
      const section =
        const section = tab.replace("Tab", "");

      await window.openSection(section);
    });
  });
}
