import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function trackEvent(eventName, extra = {}) {
  addDoc(collection(getFirestore(), "analytics"), {
    visitorId: localStorage.getItem("rctxVisitor"),
    clientId: window.RCTX_CLIENT_ID || "unknown-client",
    domain: location.hostname,
    event: eventName,
    ...extra,
    timestamp: serverTimestamp()
  });
}

// WhatsApp
document.querySelectorAll("[data-track='whatsapp']").forEach(btn =>
  btn.addEventListener("click", () => trackEvent("whatsapp_click"))
);

// Phone
document.querySelectorAll("[data-track='phone']").forEach(btn =>
  btn.addEventListener("click", () => trackEvent("phone_tap"))
);

// Quote / Enquiry
document.querySelectorAll("[data-track='quote']").forEach(btn =>
  btn.addEventListener("click", () => trackEvent("quote_click"))
);
