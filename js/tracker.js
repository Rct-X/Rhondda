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

const siteName = "rctx";

async function trackVisit() {
  try {

    await addDoc(collection(db, "analytics"), {
      site: siteName,
      page: window.location.pathname,
      referrer: document.referrer || "direct",
      screen: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,
      timestamp: serverTimestamp()
    });

    console.log("Tracked");

  } catch (err) {
    console.error(err);
  }
}

trackVisit();
