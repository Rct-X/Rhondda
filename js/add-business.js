import { categories } from "./business-signUp-cats.js";
const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

window.searchAliases = {};

fetch("/.netlify/functions/getCategoryAliases")
  .then(res => res.json())
  .then(categoryAliases => {

    Object.entries(categoryAliases).forEach(([category, aliases]) => {
      const slug = category.toLowerCase();

      aliases.forEach(alias => {
        window.searchAliases[alias.toLowerCase()] = slug;
      });

      // Also map the category name itself
      window.searchAliases[category.toLowerCase()] = slug;
    });

  })
  .catch(err => console.error("Alias load error", err));

// ===============================
// TOWN AUTOCOMPLETE
// ===============================
const towns = [
  "Aberaman",
  "Abercwmboi",
  "Abercynon",
  "Aberdare",
  "Abernant",
  "Beddau",
  "Blaenrhondda",
  "Blaenclydach",
  "Blaencwm",
  "Blaenllechau",
  "Brynna",
  "Caegarw",
  "Carnetown",
  "Cefn Rhigos",
  "Cefnpennar",
  "Church Village",
  "Cilfynydd",
  "Clydach Vale",
  "Coedely",
  "Cwmaman",
  "Cwmbach",
  "Cwmdare",
  "Cwmparc",
  "Cwmpennar",
  "Cymmer",
  "Dinas Rhondda",
  "Efail Isaf",
  "Ferndale",
  "Fernhill",
  "Gelli",
  "Gilfach Goch",
  "Glenboi",
  "Glyncoch",
  "Glyntaff",
  "Groesfaen",
  "Hirwaun",
  "Llanharan",
  "Llanharry",
  "Llantrisant",
  "Llantwit Fardre",
  "Llwydcoed",
  "Llwynypia",
  "Maerdy",
  "Miskin",
  "Mountain Ash",
  "Penderyn",
  "Penrhiwceiber",
  "Penrhiwfer",
  "Penrhys",
  "Pentre",
  "Pen-y-waun",
  "Penygraig",
  "Perthcelyn",
  "Pontcynon",
  "Pontyclun",
  "Pontygwaith",
  "Pontypridd",
  "Porth",
  "Rhigos",
  "Stanleytown",
  "Taff's Well",
  "Talbot Green",
  "Tonteg",
  "Ton Pentre",
  "Tonypandy",
  "Tonyrefail",
  "Trealaw",
  "Trebanog",
  "Trecynon",
  "Treforest",
  "Trehafod",
  "Treherbert",
  "Treorchy",
  "Tylorstown",
  "Tynewydd",
  "Upper Boat",
  "Wattstown",
  "Williamstown",
  "Ynysboeth",
  "Ynyshir",
  "Ynysmaerdy",
  "Ynyswen",
  "Ynysybwl",
  "Ystrad"
]


const townInput = document.getElementById("town");
const suggestions = document.getElementById("townSuggestions");

townInput.addEventListener("input", () => {

  const value = townInput.value.toLowerCase();

  suggestions.innerHTML = "";

  if (!value) {
    suggestions.style.display = "none";
    return;
  }

  const matches = towns.filter(town =>
    town.toLowerCase().includes(value)
  );

  if (!matches.length) {
    suggestions.style.display = "none";
    return;
  }

  matches.forEach(match => {

    const div = document.createElement("div");

    div.className = "suggestion-item";
    div.textContent = match;

    div.addEventListener("click", () => {
      townInput.value = match;
      suggestions.style.display = "none";
    });

    suggestions.appendChild(div);

  });

  suggestions.style.display = "block";

});

document.addEventListener("click", (e) => {

  if (!e.target.closest(".form-group")) {
    suggestions.style.display = "none";
  }

});

// ===============================
// CATEGORY AUTOCOMPLETE
// ===============================
const categoryInput = document.getElementById("category");
const categorySuggestions = document.getElementById("categorySuggestions");

categoryInput.addEventListener("input", () => {
  const value = categoryInput.value.toLowerCase();
  categorySuggestions.innerHTML = "";

  if (!value) {
    categorySuggestions.style.display = "none";
    return;
  }

  const matches = categories.filter(cat =>
    cat.toLowerCase().includes(value)
  );

  if (!matches.length) {
    categorySuggestions.style.display = "none";
    return;
  }

  matches.forEach(match => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.textContent = match;

    div.addEventListener("click", () => {
      categoryInput.value = match;
      categorySuggestions.style.display = "none";
    });

    categorySuggestions.appendChild(div);
  });

  categorySuggestions.style.display = "block";
});

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".form-group")) {
    categorySuggestions.style.display = "none";
  }
});

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
