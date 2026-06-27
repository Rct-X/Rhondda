// ======================================================
// RCTX MAP MODULE (LAZY + REUSABLE)
// ======================================================

function initBusinessMap({ address, name, town }) {

  // Support both the old and new layouts
  const mapBox =
    document.getElementById("mapBox") ||
    document.querySelector(".map-section");

  const map = document.getElementById("map");
  const locationTitle = document.getElementById("locationTitle");
  const locationSubtext = document.getElementById("locationSubtext");

  if (!mapBox || !map) return;

  if (!address) {
    mapBox.style.display = "none";
    return;
  }

  // Determine whether this looks like a proper address
  const hasFullAddress =
    address &&
    address.trim().length > 10 &&
    (
      address.includes(",") ||
      /\d/.test(address)
    );

  // Update heading
  if (locationTitle) {
    locationTitle.textContent = hasFullAddress
      ? "Visit Us"
      : `Proudly Serving ${town || ""}`.trim();
  }

  // Update subtext
  if (locationSubtext) {
    locationSubtext.textContent = hasFullAddress
      ? "Find us at our location below."
      : "Serving customers across the local area.";
  }

  // Show the map section
  mapBox.style.display = "";
  mapBox.classList.add("active");

  const query = encodeURIComponent(address);

  map.innerHTML = `
    <iframe
      width="100%"
      height="320"
      style="border:0; border-radius:10px;"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${query}&output=embed">
    </iframe>
  `;
}
