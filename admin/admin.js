// ===============================
// FIREBASE INIT
// ===============================

async function initFirebase() {

  const res =
    await fetch(
      "/.netlify/functions/firebaseConfig"
    );

  if(!res.ok){

    throw new Error(
      "Firebase config failed"
    );
  }

  const config = await res.json();

  if(!firebase.apps.length){

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
// INIT
// ===============================

(async () => {

  try{

    const services =
      await initFirebase();

    window.auth = services.auth;
    window.db = services.db;

    setupAuth();

  } catch(err){

    console.error(err);

    loginMessage.textContent =
      "System error";
  }

})();

// ===============================
// AUTH
// ===============================

function setupAuth(){

  loginBtn?.addEventListener(
    "click",
    async () => {

      const email =
        document.getElementById("adminEmail")
          .value
          .trim();

      const password =
        document.getElementById("adminPassword")
          .value
          .trim();

      loginMessage.textContent = "";

      try{

        await auth
          .signInWithEmailAndPassword(
            email,
            password
          );

      } catch(err){

        console.error(err);

        loginMessage.textContent =
          "Invalid login";
      }
    }
  );

  auth.onAuthStateChanged(
    async user => {

      if(!user){

        loginSection.style.display =
          "block";

        hideAllSections();

        return;
      }

      loginSection.style.display =
        "none";

      // DEFAULT SECTION
      await openSection("dashboard");
    }
  );
}

// ===============================
// SECTION ROUTER
// ===============================

function hideAllSections(){

  document
    .querySelectorAll(
      ".admin-panel-section"
    )
    .forEach(section => {

      section.style.display = "none";
    });
}

window.openSection =
async function(section){

  hideAllSections();

  const target =
    document.getElementById(
      section + "Section"
    );

  if(target){

    target.style.display = "block";
  }

  // LAZY LOAD MODULES
  if(section === "dashboard"){

    await import("/moderation.js");
  }

  if(section === "analytics"){

    await import("/analytics.js");
  }

  if(section === "marketing"){

    await import("/marketing.js");
  }
};
