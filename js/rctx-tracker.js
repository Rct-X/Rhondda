(function () {

  // ============================
  // CONFIG
  // ============================
  const CLIENT_ID =
    window.RCTX_CLIENT_ID || "Unknown";

  const ENDPOINT =
    "https://rctx.co.uk/.netlify/functions/track";

  // ============================
  // IGNORE TRACKING
  // ============================
  if (
    localStorage.getItem(
      "rctx_ignore_tracking"
    ) === "true"
  ) {

    console.log(
      "%cTRACKING DISABLED",
      `
        color:red;
        font-size:16px;
        font-weight:bold;
      `
    );

    return;
  }

  function getBusinessContext() {

  const parts =
    window.location.pathname.split("/").filter(Boolean);

  if (parts[0] !== "directory") {
    return null;
  }

  return {
    area: parts[1] || null,
    businessId: parts[2] || null
  };
  }
  // ============================
  // DEVICE DETECTION
  // ============================
  function getDevice() {

    const ua =
      navigator.userAgent.toLowerCase();

    if (/ipad|tablet/.test(ua)) {
      return "Tablet";
    }

    if (/mobile|iphone|android/.test(ua)) {
      return "Mobile";
    }

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

      console.warn(
        "[TRACKER] Failed sending event, queueing...",
        err
      );

      // ============================
      // OFFLINE QUEUE
      // ============================
      try {

        const queue =
          JSON.parse(
            localStorage.getItem("rctx_queue") || "[]"
          );

        queue.push(payload);

        localStorage.setItem(
          "rctx_queue",
          JSON.stringify(queue)
        );

      } catch (_) {}
    }
  }

  // ============================
  // FLUSH OFFLINE QUEUE
  // ============================
  async function flushQueue() {

    try {

      const queue =
        JSON.parse(
          localStorage.getItem("rctx_queue") || "[]"
        );

      if (!queue.length) {
        return;
      }

      console.log(
        "[TRACKER] Flushing queued events:",
        queue.length
      );

      for (const item of queue) {

        await sendEvent(item);
      }

      localStorage.removeItem("rctx_queue");

      console.log(
        "[TRACKER] Queue flushed"
      );

    } catch (err) {

      console.error(
        "[TRACKER] Queue flush failed",
        err
      );
    }
  }

  // ============================
  // ONLINE RECOVERY
  // ============================
  window.addEventListener(
    "online",
    flushQueue
  );

  // ============================
  // TRACK FUNCTION
  // ============================
function track(eventName = "page_view") {

const biz = getBusinessContext();

const payload = {
  clientId: CLIENT_ID,
  businessId: biz?.businessId || null,
  area: biz?.area || null,
  page: window.location.pathname,
  event: eventName,
  device: getDevice(),
  referrer: document.referrer || "direct",
  ts: Date.now()
};

  console.log("[TRACKER] Sending:", payload);

  sendEvent(payload);
}

  // ============================
  // PAGE VIEW
  // ============================
  track("page_view");

  // ============================
  // WHATSAPP CLICKS
  // ============================
  document
    .querySelectorAll('a[href*="wa.me"]')
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          console.log(
            "[TRACKER] WhatsApp click"
          );

          track("whatsapp_click");

        },
        { once: true }
      );
    });

  // ============================
  // PHONE TAPS
  // ============================
  document
    .querySelectorAll('a[href^="tel:"]')
    .forEach(btn => {

      btn.addEventListener(
        "click",
        () => {

          console.log(
            "[TRACKER] Phone tap"
          );

          track("phone_tap");

        },
        { once: true }
      );
    });

  // ============================
  // FORM SUBMITS
  // ============================
  const form =
    document.querySelector("form");

  if (form) {

    form.addEventListener(
      "submit",
      () => {

        console.log(
          "[TRACKER] Form submit"
        );

        track("form_submit");

      },
      { once: true }
    );
  }

  // ============================
  // FLUSH STORED EVENTS
  // ============================
  flushQueue();

})();
