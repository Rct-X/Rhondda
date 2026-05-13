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
  if(sessionStorage.getItem("rctxTracked")){
    return;
  }

  // BLOCK LOCAL + DASHBOARD + PREVIEWS
  if(

    window.location.hostname.includes("localhost") ||

    window.location.pathname.includes("dashboard") ||

    window.location.hostname.includes("--")

  ){
    return;
  }

  try {

    const response =
      await fetch("/.netlify/functions/firebaseConfig");

    const firebaseConfig =
      await response.json();

    const app =
      getApps().length
      ? getApps()[0]
      : initializeApp(firebaseConfig);

    const db = getFirestore(app);

    await addDoc(collection(db,"analytics"),{

      clientId:
        window.RCTX_CLIENT_ID ||
        "unknown-client",

      domain:
        window.location.hostname,

      page:
        window.location.pathname,

      fullPath:
        window.location.href,

      referrer:
        document.referrer || "direct",

      screen:
        `${window.innerWidth}x${window.innerHeight}`,

      language:
        navigator.language,

      timestamp:
        serverTimestamp()

    });

    sessionStorage.setItem(
      "rctxTracked",
      "true"
    );

    console.log("Tracked");

  } catch(err){

    console.error(err);

  }

}

startTracker();
