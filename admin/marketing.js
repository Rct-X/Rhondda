// marketing.js
// Handles navigation + admin-only access for Marketing Tools

document.addEventListener("DOMContentLoaded", () => {
  // Ensure user is logged in (your existing admin auth)
  const adminUser = localStorage.getItem("rctx_admin");

  if (!adminUser) {
    window.location.href = "/admin/login.html";
    return;
  }

  // Elements
  const scraperBtn = document.getElementById("open-scraper");
  const followupsBtn = document.getElementById("open-followups");
  const dashboardBtn = document.getElementById("open-claim-dashboard");

  // Navigation handlers
  if (scraperBtn) {
    scraperBtn.addEventListener("click", () => {
      window.location.href = "/admin/scraper.html";
    });
  }

  if (followupsBtn) {
    followupsBtn.addEventListener("click", () => {
      window.location.href = "/admin/followups.html";
    });
  }

  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      window.location.href = "/admin/claim-dashboard.html";
    });
  }

  // Optional: highlight active section
  const current = window.location.pathname;
  const links = document.querySelectorAll(".tool-card");

  links.forEach(link => {
    if (current.includes(link.getAttribute("data-page"))) {
      link.classList.add("active");
    }
  });
});
