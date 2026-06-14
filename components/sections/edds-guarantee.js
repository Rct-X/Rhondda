const el = document.querySelector(".reveal-words");

if(el){

    const originalText = el.innerText.trim();

    const words = originalText.split(" ");

    el.innerHTML = words.map((word, i) =>
        `<span style="animation-delay:${i * 0.08}s">${word}&nbsp;</span>`
    ).join("");

    const spans = el.querySelectorAll("span");

    spans.forEach(span => {
        span.style.animationPlayState = "paused";
    });

    const observer = new IntersectionObserver((entries) => {

        if(entries[0].isIntersecting){

            spans.forEach(span => {
                span.style.animationPlayState = "running";
            });

            observer.disconnect();

        }

    }, {
        threshold: 0.3
    });

    observer.observe(el);

}
