document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     WORD-BY-WORD REVEAL
  ============================ */

  const el = document.querySelector(".reveal-words");

  if (el) {
    const originalText = el.textContent.trim();
    const words = originalText.split(" ");

    const frag = document.createDocumentFragment();

    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.style.animationDelay = `${i * 0.08}s`;
      span.innerHTML = word + "&nbsp;";
      span.style.animationPlayState = "paused";
      frag.appendChild(span);
    });

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



  /* ============================
     PROJECT CARD ANIMATION
  ============================ */

  const projectCards = document.querySelectorAll(".project-card");

  const projectObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          projectObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.30 }
  );

  projectCards.forEach((card) => projectObserver.observe(card));

});
