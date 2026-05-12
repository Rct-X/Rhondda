console.log("Tracker loaded");

import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function startTracker() {

  const alreadyTracked = sessionStorage.getItem("rctxTracked");
  if (alreadyTracked) return;

  const response = await fetch("/.netlify/functions/firebaseConfig");
  const firebaseConfig = await response.json();

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);

  if (
    window.location.hostname.includes("localhost") ||
    window.location.pathname.includes("dashboard")
  ) return;

  try {

    await addDoc(collection(db, "analytics"), {

      clientId: window.RCTX_CLIENT_ID || "unknown",
      site: window.location.hostname,

      page: window.location.pathname,
      referrer: document.referrer || "direct",

      screen: `${window.innerWidth}x${window.innerHeight}`,
      language: navigator.language,

      timestamp: serverTimestamp()

    });

    sessionStorage.setItem("rctxTracked", "true");

    console.log("Tracked");

  } catch (err) {
    console.error("TRACK ERROR:", err);
  }
}

startTracker();
