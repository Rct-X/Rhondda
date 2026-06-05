const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

// ===============================
// SLUGIFY
// ===============================
function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ===============================
// WASTE LICENCE FIELD
// ===============================
const categorySelect = document.getElementById("category");
const wasteLicenceGroup = document.getElementById("wasteLicenceGroup");
const wasteLicenceInput = document.getElementById("wasteLicence");

const wasteCategories = [
  "Waste Collection",
  "Removals"
];

function toggleWasteLicenceField() {
  const selectedCategory = categorySelect.value;

  if (wasteCategories.includes(selectedCategory)) {
    wasteLicenceGroup.style.display = "block";
    wasteLicenceInput.required = true;
  } else {
    wasteLicenceGroup.style.display = "none";
    wasteLicenceInput.required = false;
    wasteLicenceInput.value = "";
  }
}

if (categorySelect) {
  categorySelect.addEventListener("change", toggleWasteLicenceField);

  // Run immediately on page load
  toggleWasteLicenceField();
}

// ===============================
// FORM SUBMIT
// ===============================
if (form) {

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    formMessage.textContent = "";
    formMessage.className = "form-message";

    // ===============================
    // GET FORM VALUES
    // ===============================
    const name = document.getElementById("name").value.trim();
    const category = document.getElementById("category").value;
    const town = document.getElementById("town").value;
    const email = document.getElementById("email").value.trim();

    const phone = document.getElementById("phone").value.trim();
    let website = document.getElementById("website").value.trim();

// Add https:// automatically
if (
  website &&
  !website.startsWith("http://") &&
  !website.startsWith("https://")
) {
  website = `https://${website}`;
}
    const address = document.getElementById("address").value.trim();

    const description = document.getElementById("description").value.trim();

    const extraKeywords = document.getElementById("extraKeywords").value.trim();

    const wasteLicence = document.getElementById("wasteLicence").value.trim();

    const consent = document.getElementById("consent").checked;
const slug = slugify(name);
const townSlug = slugify(town);
const categorySlug = slugify(category);
    // ===============================
    // VALIDATION
    // ===============================
    if (
      !name ||
      !category ||
      !town ||
      !description ||
      !consent
    ) {
      formMessage.textContent =
        "Please fill in all required fields.";

      formMessage.classList.add("error");

      return;
    }

    // Waste licence required
    if (
      wasteCategories.includes(category) &&
      !wasteLicence
    ) {
      formMessage.textContent =
        "Please enter your waste carrier licence number.";

      formMessage.classList.add("error");

      return;
    }

    // ===============================
    // CHECK IF BUSINESS EXISTS
    // ===============================

    try {

      const checkRes = await fetch(
        "/.netlify/functions/checkBusinessExists",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            slug
          })
        }
      );

      const checkData = await checkRes.json();

      if (checkData.exists) {

        formMessage.textContent =
          "This business is already listed or awaiting approval.";

        formMessage.classList.add("error");

        return;
      }

    } catch (err) {

      formMessage.textContent =
        "Could not verify business. Please try again.";

      formMessage.classList.add("error");

      return;
    }

    // ===============================
    // SUBMIT BUSINESS
    // ===============================
    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting…";

    try {

      const res = await fetch(
        "/.netlify/functions/submitBusiness",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
  name,
  email,            
  category,
  categorySlug,
  town,
  townSlug,
  slug,
  phone,
  website,
  address,
  description,
  extraKeywords,
  wasteLicence
})
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Something went wrong."
        );
      }

      formMessage.innerHTML = `
  <strong>
    Thank you! Your business has been submitted for review.
  </strong>

  <br><br>

  Need a professional website for your business?

  <br><br>

  <a
    href="/pricing"
    class="inline-link">
    Websites from £30/month →
  </a>
`;

      formMessage.classList.add("success");

      form.reset();

      // Reset hidden field state
      toggleWasteLicenceField();

    } catch (err) {

      formMessage.textContent =
        err.message || "Something went wrong. Please try again.";

      formMessage.classList.add("error");

    } finally {

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Business";
    }

  });

}
