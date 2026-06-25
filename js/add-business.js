// ======================================
// BUSINESS SIGN-UP — FRONTEND LOGIC
// ======================================

// ===============================
// FORM ELEMENTS
// ===============================
const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

// ===============================
// TOWN AUTOCOMPLETE
// ===============================
const towns = [
  "Aberaman","Abercwmboi","Abercynon","Aberdare","Abernant","Beddau",
  "Blaenrhondda","Blaenclydach","Blaencwm","Blaenllechau","Brynna",
  "Caegarw","Carnetown","Cefn Rhigos","Cefnpennar","Church Village",
  "Cilfynydd","Clydach Vale","Coedely","Cwmaman","Cwmbach","Cwmdare",
  "Cwmparc","Cwmpennar","Cymmer","Dinas Rhondda","Efail Isaf","Ferndale",
  "Fernhill","Gelli","Gilfach Goch","Glenboi","Glyncoch","Glyntaff",
  "Groesfaen","Hirwaun","Llanharan","Llanharry","Llantrisant",
  "Llantwit Fardre","Llwydcoed","Llwynypia","Maerdy","Miskin",
  "Mountain Ash","Penderyn","Penrhiwceiber","Penrhiwfer","Penrhys",
  "Pentre","Pen-y-waun","Penygraig","Perthcelyn","Pontcynon",
  "Pontyclun","Pontygwaith","Pontypridd","Porth","Rhigos","Stanleytown",
  "Taff's Well","Talbot Green","Tonteg","Ton Pentre","Tonypandy",
  "Tonyrefail","Trealaw","Trebanog","Trecynon","Treforest","Trehafod",
  "Treherbert","Treorchy","Tylorstown","Tynewydd","Upper Boat",
  "Wattstown","Williamstown","Ynysboeth","Ynyshir","Ynysmaerdy",
  "Ynyswen","Ynysybwl","Ystrad"
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
// WASTE LICENCE LOGIC
// ===============================
const wasteLicenceGroup = document.getElementById("wasteLicenceGroup");
const wasteLicenceInput = document.getElementById("wasteLicence");

document.querySelectorAll("input[name='collectsWaste']").forEach(radio => {
  radio.addEventListener("change", () => {
    if (radio.value === "yes") {
      wasteLicenceGroup.style.display = "block";
      wasteLicenceInput.required = true;
    } else {
      wasteLicenceGroup.style.display = "none";
      wasteLicenceInput.required = false;
      wasteLicenceInput.value = "";
    }
  });
});

// ===============================
// KEYWORD CHIP SYSTEM
// ===============================

function renderSignupKeywordChips(keywords) {
  const container = document.getElementById("signupKeywordEditor");
  container.innerHTML = "";

  keywords.forEach((kw, index) => {
    const chip = document.createElement("div");
    chip.className = "keyword-chip";

    const input = document.createElement("input");
    input.value = kw;
    input.addEventListener("input", updateSignupKeywords);

    const remove = document.createElement("span");
    remove.className = "keyword-remove";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      keywords.splice(index, 1);
      renderSignupKeywordChips(keywords);
      updateSignupKeywords();
    });

    chip.appendChild(input);
    chip.appendChild(remove);
    container.appendChild(chip);
  });
}

function getSignupKeywords() {
  const inputs = document.querySelectorAll("#signupKeywordEditor input");
  return Array.from(inputs)
    .map(i => i.value.trim().toLowerCase())
    .filter(v => v.length > 0);
}

function updateSignupKeywords() {
  // Keywords are collected on submit
}

document.getElementById("signupAddKeywordBtn").addEventListener("click", () => {
  const keywords = getSignupKeywords();
  keywords.push("");
  renderSignupKeywordChips(keywords);
});

// Start with one empty chip
renderSignupKeywordChips([""]);

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
    const categoryRaw = document.getElementById("category").value.trim();
    const town = document.getElementById("town").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();

    let website = document.getElementById("website").value.trim();
    if (website && !website.startsWith("http://") && !website.startsWith("https://")) {
      website = `https://${website}`;
    }

    const address = document.getElementById("address").value.trim();
    const description = document.getElementById("description").value.trim();

    const extraKeywords = getSignupKeywords();

    const collectsWaste = document.querySelector("input[name='collectsWaste']:checked")?.value || "no";
    const wasteLicence = document.getElementById("wasteLicence").value.trim();

    const consent = document.getElementById("consent").checked;

    const slug = slugify(name);
    const townSlug = slugify(town);

    // ===============================
    // VALIDATION
    // ===============================
    if (!name || !categoryRaw || !town || !description || !consent) {
      formMessage.textContent = "Please fill in all required fields.";
      formMessage.classList.add("error");
      return;
    }

    if (collectsWaste === "yes" && !wasteLicence) {
      formMessage.textContent = "Please enter your waste carrier licence number.";
      formMessage.classList.add("error");
      return;
    }

    // ===============================
    // CHECK IF BUSINESS EXISTS
    // ===============================
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
          email,
          categoryRaw,
          collectsWaste,
          wasteLicence,
          town,
          townSlug,
          slug,
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

      formMessage.innerHTML = `
  <strong>Thanks, your business has been submitted for review!</strong>
  <br><br>
  We’ll take a quick look and get it live as soon as possible.
  <br><br>
  If you ever want a simple, affordable website that helps bring in customers,
  have a look at our options:
  <br>
  <a href="/pricing" class="inline-link">Websites £30/month →</a>
`;
      formMessage.classList.add("success");
      form.reset();
      wasteLicenceGroup.style.display = "none";
      renderSignupKeywordChips([""]);

    } catch (err) {
      formMessage.textContent = err.message || "Something went wrong. Please try again.";
      formMessage.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Business";
    }
  });
}
