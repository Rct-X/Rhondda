// =========================
// MOBILE MENU
// =========================

const btn = document.getElementById("hamburgerBtn");
const menu = document.getElementById("mobileMenu");

if (btn && menu) {

    function closeMenu() {
        menu.classList.remove("open");
        btn.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
    }

    function openMenu() {
        menu.classList.add("open");
        btn.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
    }

    // Toggle menu
    btn.addEventListener("click", () => {
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

    // Close on ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });

    // Close when nav link clicked
    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });
}

// =========================
// FAQ ACCORDION
// =========================

document.querySelectorAll(".card-faq").forEach(item => {
    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");

        // Close all
        document.querySelectorAll(".card-faq").forEach(i => {
            i.classList.remove("open");
            i.querySelector(".faq-icon").textContent = "+";
        });

        // Open selected
        if (!isOpen) {
            item.classList.add("open");
            item.querySelector(".faq-icon").textContent = "–";
        }
    });
});

// =========================
// REVEAL ON SCROLL
// =========================

const revealItems = document.querySelectorAll(".card-service, .card-step");

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {

            if (entry.target.classList.contains("card-service")) {
                setTimeout(() => {
                    entry.target.classList.add("show");
                }, index * 120);
            } else {
                entry.target.classList.add("show");
            }

            revealObserver.unobserve(entry.target);
        }
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
