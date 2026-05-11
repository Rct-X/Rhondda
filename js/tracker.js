import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* CHANGE FOR EACH WEBSITE */
const siteName = "rctx";

async function trackVisit() {

  try {

    await addDoc(collection(db, "analytics"), {

      site: siteName,

      page: window.location.pathname,

      url: window.location.href,

      hostname: window.location.hostname,

      referrer: document.referrer || "direct",

      userAgent: navigator.userAgent,

      language: navigator.language,

      screen: `${window.innerWidth}x${window.innerHeight}`,

      timestamp: serverTimestamp()

    });

    console.log("Visit tracked");

  } catch (err) {

    console.error("Tracking error:", err);

  }
}

trackVisit();
