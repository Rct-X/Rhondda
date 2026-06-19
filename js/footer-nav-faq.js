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
                const ans = item.querySelector('.faq-answer');
                if (ans) ans.style.maxHeight = null;
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
// FOOTER CSS LOAD (NON-BLOCKING)
// =========================

(function loadFooterCSS() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/footer.css";
    link.media = "print";

    link.onload = function () {
        link.media = "all";
    };

    document.head.appendChild(link);
})();


// =========================
// FOOTER HTML LOAD
// =========================

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("footer-container");
    if (!container) return;

    try {
        const res = await fetch("/components/sections/footer.html");

        if (!res.ok) {
            console.error("Footer failed to load:", res.status);
            return;
        }

        const html = await res.text();
        container.innerHTML = html;

    } catch (err) {
        console.error("Footer load error:", err);
    }
});
