// ======================================================
// RCTX MAP MODULE (LAZY + REUSABLE)
// ======================================================

function initBusinessMap({ address, name }) {
  const mapBox = document.getElementById("mapBox");
  const map = document.getElementById("map");

  if (!mapBox || !map) return;

  if (!address) {
    mapBox.style.display = "none";
    return;
  }

  mapBox.classList.add("active");

  const query = encodeURIComponent(address);

  map.innerHTML = `
    <iframe
      width="100%"
      height="320"
      style="border:0; border-radius: 10px;"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${query}&output=embed">
    </iframe>
  `;
}
