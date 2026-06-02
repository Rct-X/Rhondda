const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    formMessage.textContent = "";
    formMessage.className = "form-message";

    const name = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value;
    const town = document.getElementById("town").value;
    const phone = document.getElementById("phone").value.trim();
    const website = document.getElementById("website").value.trim();
    const address = document.getElementById("address").value.trim();
    const description = document.getElementById("description").value.trim();
    const extraKeywords = document.getElementById("extraKeywords").value.trim();
    const consent = document.getElementById("consent").checked;

    if (!name || !category || !town || !description || !consent) {
      formMessage.textContent = "Please fill in all required fields.";
      formMessage.classList.add("error");
      return;
    }

    // ===============================
    // CHECK IF BUSINESS ALREADY EXISTS
    // ===============================
    const slug = slugify(name);

    try {
      const checkRes = await fetch("/.netlify/functions/checkBusinessExists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      });

      const checkData = await checkRes.json();

      if (checkData.exists) {
        formMessage.textContent = "This business is already listed or awaiting approval.";
        formMessage.classList.add("error");
        return;
      }
    } catch (err) {
      formMessage.textContent = "Could not verify business. Please try again.";
      formMessage.classList.add("error");
      return;
    }

    // ===============================
    // SUBMIT BUSINESS
    // ===============================
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {
      const res = await fetch("/.netlify/functions/submitBusiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          town,
          phone,
          website,
          address,
          description,
          extraKeywords
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      formMessage.textContent = "Thank you! Your business has been submitted for review.";
      formMessage.classList.add("success");
      form.reset();
    } catch (err) {
      formMessage.textContent = err.message || "Something went wrong. Please try again.";
      formMessage.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Business";
    }
  });
}
