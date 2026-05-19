(function(){

  const CLIENT_ID =
    window.RCTX_CLIENT_ID || "Unknown";

  function getDevice(){

    const ua = navigator.userAgent;

    if(/mobile/i.test(ua)){
      return "Mobile";
    }

    if(/tablet|ipad/i.test(ua)){
      return "Tablet";
    }

    return "Desktop";
  }

  async function track(eventName = "page_view"){

    try{

      await fetch("/.netlify/functions/track.js", {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body: JSON.stringify({

          clientId: CLIENT_ID,
          page: window.location.pathname,
          event: eventName,
          device: getDevice(),
          referrer: document.referrer || "direct"

        })
      });

    }catch(err){}
  }

  // PAGE VIEW
  track("page_view");

  // WHATSAPP
  document
  .querySelectorAll('a[href*="wa.me"]')
  .forEach(btn => {

    btn.addEventListener("click", () => {
      track("whatsapp_click");
    });

  });

  // PHONE
  document
  .querySelectorAll('a[href^="tel:"]')
  .forEach(btn => {

    btn.addEventListener("click", () => {
      track("phone_tap");
    });

  });

  // FORM
  const form =
    document.querySelector("form");

  if(form){

    form.addEventListener("submit", () => {
      track("form_submit");
    });

  }

})();
