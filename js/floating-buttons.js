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
  `);

  const scrollBtn = document.getElementById("scrollTopBtn");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

});
