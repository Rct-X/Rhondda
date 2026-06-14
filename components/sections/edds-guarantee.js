document.addEventListener("DOMContentLoaded", () => {
    const el = document.querySelector(".reveal-words");
    const text = el.innerText.trim().split(" ");
    el.innerHTML = text.map((word, i) =>
        `<span style="animation-delay:${i * 0.08}s">${word}&nbsp;</span>`
    ).join("");

    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            el.classList.add("active");
            observer.disconnect();
        }
    });

    observer.observe(el);
});
