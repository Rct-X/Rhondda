document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     WORD-BY-WORD REVEAL
  ============================ */

  const el = document.querySelector(".reveal-words");

  if (el) {
    const originalText = el.textContent.trim();
    const words = originalText.split(" ");

    // Build HTML in memory (no reflow)
    const frag = document.createDocumentFragment();

    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.style.animationDelay = `${i * 0.08}s`;
      span.innerHTML = word + "&nbsp;";
      span.style.animationPlayState = "paused";
      frag.appendChild(span);
    });

    // Single DOM write
    el.innerHTML = "";
    el.appendChild(frag);

    const spans = el.querySelectorAll("span");

    const wordObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        spans.forEach(span => span.style.animationPlayState = "running");
        wordObserver.disconnect();
      }
    }, { threshold: 0.3 });

    wordObserver.observe(el);
  }


  /* ============================
     LETTER REVEAL SECTION
  ============================ */

  const section = document.querySelector(".reveal-section");

  if (section) {
    const title = document.getElementById("revealTitle");

    if (title) {
      const text = title.textContent.trim();
      const frag = document.createDocumentFragment();

      Array.from(text).forEach((char, i) => {
        const span = document.createElement("span");
        span.className = char === " " ? "space" : "char";
        if (char !== " ") {
          span.textContent = char;
          span.style.animationDelay = `${i * 0.04}s`;
        }
        frag.appendChild(span);
      });

      // Single DOM write
      title.textContent = "";
      title.appendChild(frag);

      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            section.classList.add("is-visible");
            revealObserver.unobserve(section);
          }
        });
      }, { threshold: 0.25 });

      revealObserver.observe(section);
    }
  }


  /* ============================
     FADE-UP ANIMATIONS
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
