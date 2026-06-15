document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     WORD‑BY‑WORD REVEAL
  ============================ */
  const el = document.querySelector(".reveal-words");

  if (el) {
    const originalText = el.innerText.trim();
    const words = originalText.split(" ");

    el.innerHTML = words
      .map((word, i) => `<span style="animation-delay:${i * 0.08}s">${word}&nbsp;</span>`)
      .join("");

    const spans = el.querySelectorAll("span");

    spans.forEach(span => {
      span.style.animationPlayState = "paused";
    });

    const wordObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        spans.forEach(span => {
          span.style.animationPlayState = "running";
        });
        wordObserver.disconnect();
      }
    }, { threshold: 0.3 });

    wordObserver.observe(el);
  }


  /* ============================
     FADE‑UP ANIMATIONS
  ============================ */
  const items = document.querySelectorAll(".fade-up");

  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  items.forEach(item => fadeObserver.observe(item));

});
