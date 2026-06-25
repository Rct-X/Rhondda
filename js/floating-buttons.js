document.addEventListener("DOMContentLoaded", () => {

  document.body.insertAdjacentHTML("beforeend", `
    <div class="floating-actions">

      <button class="floating-btn contact-btn" id="contactBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <button class="floating-btn scroll-top" id="scrollTopBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 19V5"/>
          <path d="M5 12l7-7 7 7"/>
        </svg>
      </button>

    </div>

    <div id="contactOverlay" class="contact-overlay">

      <div class="contact-header">
        <h2>Contact RCTX</h2>

        <button id="closeContactOverlay" class="contact-close">
          ✕
        </button>
      </div>

      <div class="contact-content">

        <a href="https://wa.me/447434745240"
           class="contact-option whatsapp"
           target="_blank">
           💬 WhatsApp Eddie
        </a>

        <a href="tel:+447434745240"
           class="contact-option">
           📞 Call
        </a>

        <a href="mailto:support@rctx.co.uk"
           class="contact-option">
           ✉️ Email
        </a>

        <a href="/contact"
           class="contact-option">
           📝 Contact Form
        </a>

      </div>

    </div>
  `);

  const scrollBtn = document.getElementById("scrollTopBtn");
  const contactBtn = document.getElementById("contactBtn");
  const overlay = document.getElementById("contactOverlay");
  const closeBtn = document.getElementById("closeContactOverlay");

  // Scroll button
  window.addEventListener("scroll", () => {
    scrollBtn.classList.toggle("show", window.scrollY > 400);
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  // Contact overlay
  contactBtn.addEventListener("click", () => {
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
  });

});
