document.addEventListener("DOMContentLoaded", () => {
  // CONFIGURATION: Change your text phrase and speed here
  const textToType = "Web design pricing built for the Valleys.";
  const typingSpeed = 60; // Milliseconds per character
  
  const headerElement = document.getElementById("typing-text-target");
  const subElement = document.querySelector(".pricing-intro-sub");
  
  let charIndex = 0;
  let hasStartedIndex = false;

  // The typing engine function
  function typeText() {
    if (charIndex < textToType.length) {
      headerElement.textContent += textToType.charAt(charIndex);
      charIndex++;
      setTimeout(typeText, typingSpeed);
    } else {
      // Typing is finished: clear cursor and fade up subtitle
      headerElement.classList.add("typing-complete");
      if (subElement) {
        subElement.classList.add("reveal");
      }
    }
  }

  // Setup the scroll trigger
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasStartedIndex) {
        hasStartedIndex = true; // Prevent double firing
        typeText();
        observer.unobserve(entry.target); // Kill observer to save mobile performance
      }
    });
  }, { threshold: 0.3 }); // Triggers when 20% of the element is visible

  if (headerElement) {
    observer.observe(headerElement);
  }
});
