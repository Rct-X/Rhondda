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

  // Persistent visitor ID
  let visitorId = localStorage.getItem("rctxVisitor");
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("rctxVisitor", visitorId);
  }

  // Per‑page session dedupe
  const trackKey = "rctxTracked_" + window.location.pathname;
  if (sessionStorage.getItem(trackKey)) return;

  // Block local + dashboard + Netlify previews
  if (
    location.hostname.includes("localhost") ||
    location.pathname.includes("dashboard") ||
    location.hostname.includes("--")
  ) return;

  try {
    const response = await fetch("https://rctx.co.uk/.netlify/functions/firebaseConfig");
    const firebaseConfig = await response.json();

    const app = getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);

    const db = getFirestore(app);

    await addDoc(collection(db, "analytics"), {
      visitorId,
      clientId: window.RCTX_CLIENT_ID || "unknown-client",
      domain: location.hostname,
      page: location.pathname,
      fullPath: location.href,
      referrer: document.referrer || "direct",
      device: /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
      screen: `${innerWidth}x${innerHeight}`,
      language: navigator.language,
      event: "pageview",
      timestamp: serverTimestamp()
    });

    sessionStorage.setItem(trackKey, "true");
    console.log("Tracked");

  } catch (err) {
    console.error(err);
  }
}

startTracker();
