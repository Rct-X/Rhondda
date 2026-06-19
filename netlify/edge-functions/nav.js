const nav = ` <nav class="navbar" aria-label="Main navigation">
    <div class="container">

        <div class="nav-flex">

            <a href="/" class="logo-wrap" aria-label="RCTX Home">
                <div class="logo">
                    RCT<span>X</span>
                </div>
                <div class="logo-tag">
                    Web Design
                </div>
            </a>

            <button
                class="hamburger"
                id="hamburgerBtn"
                type="button"
                aria-label="Open navigation menu"
                aria-expanded="false"
                aria-controls="mobileMenu">

                <span></span>
                <span></span>
                <span></span>

            </button>

            <ul class="nav-links" id="mobileMenu">

                <!-- WEB DESIGN GROUP -->
                <li class="nav-group">
                    <button class="nav-group-title" type="button">
                        Web Design
                    </button>

                    <ul class="nav-sub">
                        <li><a href="/pricing">View Pricing</a></li>
                        <li><a href="/about">About RCTX</a></li>
                    </ul>
                </li>

                <!-- DIRECTORY GROUP -->
                <li class="nav-group">
                    <button class="nav-group-title" type="button">
                        Directory
                    </button>

                    <ul class="nav-sub">
                        <li><a href="/directory">Find Businesses</a></li>
                        <li><a href="/add-business">Add Your Business</a></li>
                    </ul>
                </li>
 <li><a href="/contact">Get in Touch</a></li><li class="owner-login">
  <a href="/owner-login" class="owner-login-link">
    Business Login
  </a>
</li>
                <!-- CTA (IMPORTANT) -->
                <li class="nav-cta">
                    <p>Business websites from £30/month</p>
                    <a href="/pricing" class="nav-cta-btn">
                        View Pricing
                    </a>
                </li>

            </ul>

        </div>

    </div>
 </nav>`;
