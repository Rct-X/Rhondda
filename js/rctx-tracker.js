(function () {

  // ============================
  // CONFIG
  // ============================
  const CLIENT_ID = window.RCTX_CLIENT_ID || "Unknown";
  const ENDPOINT = "https://rctx.co.uk/.netlify/functions/track";

  // ============================
  // DEVICE DETECTION
  // ============================
  function getDevice() {
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/.test(ua)) return "Tablet";
    if (/mobile|iphone|android/.test(ua)) return "Mobile";
    return "Desktop";
  }

  // ============================
  // SEND EVENT
  // ============================
  async function sendEvent(payload) {
    try {
      await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // If offline, queue event
      try {
        const queue = JSON.parse(localStorage.getItem("rctx_queue") || "[]");
        queue.push(payload);
        localStorage.setItem("rctx_queue", JSON.stringify(queue));
      } catch (_) {}
    }
  }

  // ============================
  // FLUSH QUEUED EVENTS
  // ============================
  async function flushQueue() {
    try {
      const queue = JSON.parse(localStorage.getItem("rctx_queue") || "[]");
      if (!queue.length) return;

      for (const item of queue) {
        await sendEvent(item);
      }

      localStorage.removeItem("rctx_queue");
    } catch (_) {}
  }

  window.addEventListener("online", flushQueue);

  // ============================
  // TRACK FUNCTION
  // ============================
  function track(eventName = "page_view") {
    const payload = {
      clientId: CLIENT_ID,
      page: window.location.pathname,
      event: eventName,
      device: getDevice(),
      referrer: document.referrer || "direct",
      ts: Date.now()
    };

    sendEvent(payload);
  }

  // ============================
  // PAGE VIEW
  // ============================
  track("page_view");

  // ============================
  // WHATSAPP CLICKS
  // ============================
  document.querySelectorAll('a[href*="wa.me"]').forEach(btn => {
    btn.addEventListener("click", () => track("whatsapp_click"), { once: true });
  });

  // ============================
  // PHONE TAPS
  // ============================
  document.querySelectorAll('a[href^="tel:"]').forEach(btn => {
    btn.addEventListener("click", () => track("phone_tap"), { once: true });
  });

  // ============================
  // FORM SUBMIT
  // ============================
  const form = document.querySelector("form");
  if (form) {
    form.addEventListener("submit", () => track("form_submit"), { once: true });
  }

  // ============================
  // FLUSH ANY QUEUED EVENTS
  // ============================
  flushQueue();

})();
