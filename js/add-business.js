const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const categories=["Accountants","Aerial Installers","Air Conditioning Services","Architects","Auto Electricians","Bakers","Barbers","Bathroom Fitters","Beauty Salons","Bedroom Fitters","Bike Repairs","Blinds & Shutters","Boiler Installers","Bricklayers","Builders","Building Supplies","Butchers","Cafes","Car Body Repairs","Car Dealers","Car Detailing","Car Hire","Car Mechanics","Car Valeting","Carpenters","Carpet Cleaners","Carpet Fitters","Caterers","Childcare Services","Chimney Sweeps","Cleaners","Computer Repairs","Conservatory Installers","Courier Services","Decorators","Dentists","Dog Groomers","Double Glazing","Drainage Services","Driving Schools","Electricians","Estate Agents","Fencing Contractors","Financial Advisors","Firewood Suppliers","Flooring Services","Florists","Funeral Directors","Garage Doors","Garden Centres","Gardeners","Gas Engineers","Graphic Designers","Greengrocers","Gutter Cleaning","Gyms","Hairdressers","Handyman Services","Heating Engineers","Home Care Services","House Clearances","Insurance Brokers","Interior Designers","Joiners","Kitchen Fitters","Landscapers","Laundry Services","Locksmiths","Man With A Van","Martial Arts Clubs","Massage Therapists","Mobile Phone Repairs","Mortgage Advisors","Nail Salons","Osteopaths","Painters & Decorators","Party Supplies","Paving Contractors","Personal Trainers","Pest Control","Pet Shops","Photographers","Physiotherapists","Pizza Shops","Plasterers","Plumbers","Pressure Washing","Printers","Removals","Restaurants","Roof Cleaners","Roofers","Scaffolding","Security Services","Shops","Skip Hire","Solar Panel Installers","Solicitors","Sports Clubs","Storage Services","Takeaways","Tattoo Studios","Taxi Services","Tilers","Travel Agents","Tree Surgeons","Tyres & Repairs","Upholstery Cleaning","Vets","Waste Collection","Wedding Services","Window Cleaners","Window Fitters","Yoga Classes"]
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
  "Treorchy",
  "Treherbert",
  "Tonypandy",
  "Porth",
  "Pontypridd",
  "Ferndale",
  "Tylorstown",
  "Treforest",
  "Tonyrefail",
  "Pentre",
  "Maerdy",
  "Mountain Ash",
  "Aberdare",
  "Ystrad",
  "Gelli",
  "Cymmer",
  "Williamstown",
  "Penygraig",
  "Trebanog",
  "Llwynypia"
];

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

const categoryInput = document.getElementById("category");
const categorySuggestions = document.getElementById("categorySuggestions");

categoryInput.addEventListener("input", () => {

  const value = categoryInput.value.toLowerCase();
  categorySuggestions.innerHTML = "";

  if (!value) {
    categorySuggestions.style.display = "none";
    return;
  }

  const matches = categories
  .filter(cat =>
    cat.toLowerCase().includes(value)
  )
  .sort((a, b) => {

    const aStarts = a.toLowerCase().startsWith(value);
    const bStarts = b.toLowerCase().startsWith(value);

    return bStarts - aStarts;
  });

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

  toggleWasteLicenceField();

});

    categorySuggestions.appendChild(div);

  });

  categorySuggestions.style.display = "block";

});


document.addEventListener("click", (e) => {

  if (!e.target.closest(".form-group")) {

    suggestions.style.display = "none";

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

  categorySelect.addEventListener(
    "input",
    toggleWasteLicenceField
  );

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

    if (!categories.includes(category)) {

  formMessage.textContent =
    "Please select a valid category from the list.";

  formMessage.classList.add("error");

  return;
    }
    
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
