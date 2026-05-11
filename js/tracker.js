console.log("Tracker loaded");

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

console.log("Firebase config loaded");

const app = initializeApp(firebaseConfig);

console.log("Firebase initialized");

const db = getFirestore(app);

async function trackVisit() {

  console.log("Tracking started");

  try {

    const result = await addDoc(collection(db, "analytics"), {

      site: "rctx",

      page: window.location.pathname,

      timestamp: serverTimestamp()

    });

    console.log("SUCCESS:", result.id);

  } catch (err) {

    console.error("ERROR:", err);

  }

}

trackVisit();
