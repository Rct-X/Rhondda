console.log("Tracker loaded");

import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function startTracker() {

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

      clientId: window.location.hostname,   // 🔥 FIX: consistent grouping
      domain: window.location.hostname,

      page: window.location.pathname,
      fullPath: window.location.href,

      referrer: document.referrer || "direct",

      screen: `${window.innerWidth || 0}x${window.innerHeight || 0}`,

      language: navigator.language,

      timestamp: serverTimestamp()

    });

    console.log("Tracked");

  } catch (err) {
    console.error("TRACK ERROR:", err);
  }
}

startTracker();
