console.log("Tracker loaded");

import {
  getApps,
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function startTracker() {

  // Prevent duplicate tracking
  const alreadyTracked = sessionStorage.getItem("rctxTracked");

  if (alreadyTracked) {
    console.log("Already tracked");
    return;
  }

  // Load Firebase config from Netlify function
  const response = await fetch("/.netlify/functions/firebaseConfig");
  const firebaseConfig = await response.json();

  console.log("Firebase config received");

  // Init Firebase (avoid double init)
  const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

  console.log("Firebase initialized");

  const db = getFirestore(app);

  if (
  window.location.hostname.includes("localhost") ||
  window.location.pathname.includes("dashboard")
) {
  return;
  }

  try {
    const result = await addDoc(
      collection(db, "analytics"),
      {
        site: "rctx",
        page: window.location.pathname,
        referrer: document.referrer || "direct",
        screen: `${window.innerWidth}x${window.innerHeight}`,
        language: navigator.language,
        timestamp: serverTimestamp()
      }
    );

    console.log("SUCCESS:", result.id);

    // Mark as tracked
    sessionStorage.setItem("rctxTracked", "true");

  } catch (err) {
    console.error("ERROR:", err);
  }
}

startTracker();
