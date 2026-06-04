// Submit claim
document.getElementById("claimForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const btn = document.querySelector(".btn");
  const status = document.getElementById("statusMsg");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const slug = document.getElementById("businessSlug").value;

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = "Submitting…";
  status.textContent = "Please wait…";

  try {
    const res = await fetch("/.netlify/functions/submitClaim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message, slug })
    });

    const data = await res.json();

    // Success UI
    status.textContent = "Thank you! Your claim has been submitted.";
    status.style.color = "green";

    // Hide form
    document.getElementById("claimForm").style.display = "none";

  } catch (err) {
    console.error(err);
    status.textContent = "Something went wrong. Please try again.";
    status.style.color = "red";
  }

  // Reset button (optional)
  btn.disabled = false;
  btn.innerHTML = "Submit Claim";
});
