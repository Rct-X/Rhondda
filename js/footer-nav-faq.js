// =========================
// MOBILE MENU (HAMBURGER)
// =========================

const btn = document.getElementById("hamburgerBtn");
const menu = document.getElementById("mobileMenu");

function closeMenu() {
    menu.classList.remove("open");
    btn.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");

    // also close all nav groups when menu closes
    document.querySelectorAll(".nav-group").forEach(g => {
        g.classList.remove("open");
    });
}

function openMenu() {
    menu.classList.add("open");
    btn.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
}

if (btn && menu) {

    btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const isOpen = menu.classList.contains("open");
        isOpen ? closeMenu() : openMenu();
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
        const clickedInside = menu.contains(e.target) || btn.contains(e.target);
        if (!clickedInside && menu.classList.contains("open")) {
            closeMenu();
        }
    });

    // ESC key closes everything
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });

    // Close menu when clicking normal links
    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}


// =========================
// MOBILE NAV GROUP TOGGLE
// =========================

document.querySelectorAll(".nav-group-title").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation();

        const group = btn.closest(".nav-group");
        if (!group) return;

        const isOpen = group.classList.contains("open");

        // close other groups (accordion behaviour)
        document.querySelectorAll(".nav-group").forEach(g => {
            if (g !== group) {
                g.classList.remove("open");
                const otherBtn = g.querySelector(".nav-group-title");
                if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
            }
        });

        // toggle current group
        group.classList.toggle("open", !isOpen);

        // ARIA state update
        btn.setAttribute("aria-expanded", String(!isOpen));
    });
});


// =========================
// FAQ ACCORDION
// =========================

document.addEventListener('DOMContentLoaded', () => {

  const faqCards = document.querySelectorAll('.card-faq');

  faqCards.forEach(card => {

    const question = card.querySelector('.faq-question');
    const answer = card.querySelector('.faq-answer');

    question.addEventListener('click', () => {

      const isOpen = card.classList.contains('active');

      faqCards.forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-answer').style.maxHeight = null;
      });

      if (!isOpen) {
        card.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }

    });

  });

});


// =========================
// REVEAL ON SCROLL
// =========================

const revealItems = document.querySelectorAll(".card-service, .card-step");

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;

        if (entry.target.classList.contains("card-service")) {
            setTimeout(() => {
                entry.target.classList.add("show");
            }, index * 120);
        } else {
            entry.target.classList.add("show");
        }

        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.15 });

revealItems.forEach(item => revealObserver.observe(item));


// =========================
// YEAR AUTO-UPDATE
// =========================

const yearSpan = document.getElementById("year");
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}
// =========================
// LAZY LOAD FOOTER CSS
// =========================

(function loadFooterCSS() {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = "/css/footer.css";
    link.media = "print"; // prevents render blocking

    link.onload = function () {
        link.media = "all"; // activate after load
    };

    document.head.appendChild(link);
})();
