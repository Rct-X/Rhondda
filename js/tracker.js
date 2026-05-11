console.log("Tracker loaded");

import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function startTracker() {

  // GET CONFIG FROM NETLIFY FUNCTION
  const response =
    await fetch("/.netlify/functions/firebase-config");

  const firebaseConfig = await response.json();

  console.log("Firebase config received");

  const app = initializeApp(firebaseConfig);

  console.log("Firebase initialized");

  const db = getFirestore(app);

  try {

    const result = await addDoc(
      collection(db, "analytics"),
      {

        site: "rctx",

        page: window.location.pathname,

        timestamp: serverTimestamp()

      }
    );

    console.log("SUCCESS:", result.id);

  } catch (err) {

    console.error("ERROR:", err);

  }

}

startTracker();
