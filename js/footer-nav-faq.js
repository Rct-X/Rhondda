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

document.querySelectorAll(".card-faq").forEach(item => {
    const question = item.querySelector(".faq-question");
    const icon = item.querySelector(".faq-icon");

    if (!question) return;

    question.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        document.querySelectorAll(".card-faq").forEach(i => {
            i.classList.remove("open");
            const iIcon = i.querySelector(".faq-icon");
            if (iIcon) iIcon.textContent = "+";
        });

        if (!isOpen) {
            item.classList.add("open");
            if (icon) icon.textContent = "–";
        }
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
