document.addEventListener("DOMContentLoaded", () => {
  const navHTML = `
    <nav class="rctx-nav" aria-label="Main navigation">
      <div class="rctx-nav-container">
        <div class="rctx-nav-flex">

          <a href="/" class="rctx-logo-wrap" aria-label="RCTX Home">
            <div class="rctx-logo">RCT<span>X</span></div>
            <div class="rctx-logo-tag">Web Design</div>
          </a>

          <button class="rctx-hamburger" id="hamburgerBtn" type="button"
            aria-label="Open navigation menu" aria-expanded="false"
            aria-controls="mobileMenu">
            <span></span><span></span><span></span>
          </button>

          <ul class="rctx-nav-links" id="mobileMenu">
            <li class="rctx-nav-group">
              <button class="rctx-nav-group-title" type="button">Web Design</button>
              <ul class="rctx-nav-sub">
                <li><a href="/pricing">View Pricing</a></li>
                <li><a href="/about">About RCTX</a></li>
              </ul>
            </li>

            <li class="rctx-nav-group">
              <button class="rctx-nav-group-title" type="button">Local Network</button>
              <ul class="rctx-nav-sub">
                <li><a href="/local">Find Local Services</a></li>
                <li><a href="/add-business">List Your Business</a></li>
              </ul>
            </li>

            <li><a href="/contact">Get in Touch</a></li>

            <li class="rctx-owner-login">
              <a href="/owner-login" class="rctx-owner-login-link">Business Login</a>
            </li>

            <li class="rctx-nav-cta">
              <p>Managed websites for just £30/month</p>
              <a href="/pricing" class="rctx-nav-cta-btn">View Pricing</a>
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

  // 3. Sub-menu toggles
  document.querySelectorAll(".rctx-nav-group-title").forEach(titleBtn => {
    titleBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      const group = titleBtn.closest(".rctx-nav-group");
      const isOpen = group.classList.contains("open");

      // close all other groups
      document.querySelectorAll(".rctx-nav-group").forEach(g => {
        if (g !== group) g.classList.remove("open");
      });

      // toggle this one
      group.classList.toggle("open", !isOpen);
    });
  });

  // 4. Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      btn.classList.remove("open");
      menu.classList.remove("open");
    }
  });

  // 5. Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      btn.classList.remove("open");
      menu.classList.remove("open");
    }
  });

  // 6. Close menu when clicking any link
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      btn.classList.remove("open");
      menu.classList.remove("open");
    });
  });
});
