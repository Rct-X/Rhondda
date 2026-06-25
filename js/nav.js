document.addEventListener("DOMContentLoaded", () => {
  const navHTML = `
    <nav class="navbar" aria-label="Main navigation">
      <div class="container">
        <div class="nav-flex">

          <a href="/" class="logo-wrap" aria-label="RCTX Home">
            <div class="logo">RCT<span>X</span></div>
            <div class="logo-tag">Web Design</div>
          </a>

          <button class="hamburger" id="hamburgerBtn" type="button"
            aria-label="Open navigation menu" aria-expanded="false"
            aria-controls="mobileMenu">
            <span></span><span></span><span></span>
          </button>

          <ul class="nav-links" id="mobileMenu">
            <li class="nav-group">
              <button class="nav-group-title" type="button">Web Design</button>
              <ul class="nav-sub">
                <li><a href="/pricing">View Pricing</a></li>
                <li><a href="/about">About RCTX</a></li>
              </ul>
            </li>

            <li class="nav-group">
              <button class="nav-group-title" type="button">Local Network</button>
              <ul class="nav-sub">
                <li><a href="/local">Find Local Services</a></li>
                <li><a href="/add-business">List Your Business</a></li>
              </ul>
            </li>

            <li><a href="/contact">Get in Touch</a></li>

            <li class="owner-login">
              <a href="/owner-login" class="owner-login-link">Business Login</a>
            </li>

            <li class="nav-cta">
              <p>Managed websites for just £30/month</p>
              <a href="/pricing" class="nav-cta-btn">View Pricing</a>
            </li>
          </ul>

        </div>
      </div>
    </nav>
  `;

  // 1. Inject nav
  document.body.insertAdjacentHTML("afterbegin", navHTML);

  // 2. Hamburger toggle
  const btn = document.getElementById("hamburgerBtn");
  const menu = document.getElementById("mobileMenu");

  btn.addEventListener("click", () => {
    btn.classList.toggle("open");
    menu.classList.toggle("open");
  });

  // 3. Sub‑menu toggles
  document.querySelectorAll(".nav-group-title").forEach(titleBtn => {
    titleBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const group = titleBtn.closest(".nav-group");
      const isOpen = group.classList.contains("open");

      // close all other groups
      document.querySelectorAll(".nav-group").forEach(g => {
        if (g !== group) g.classList.remove("open");
      });

      // toggle this one
      group.classList.toggle("open", !isOpen);
    });
  });
});
