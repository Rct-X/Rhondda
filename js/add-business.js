// ======================================
// BUSINESS SIGN-UP — FRONTEND LOGIC (CLEAN BUILD)
// ======================================

const form = document.getElementById("addBusinessForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

// safety guard
let isSubmitting = false;

// ======================================
// TOWN AUTOCOMPLETE
// ======================================
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

if (townInput && suggestions) {
  townInput.addEventListener("input", () => {
    const value = townInput.value.toLowerCase().trim();
    suggestions.innerHTML = "";

    if (!value) {
      suggestions.style.display = "none";
      return;
    }

    const matches = towns.filter(t =>
      t.toLowerCase().includes(value)
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
    if (!e.target.closest("#townSuggestions") && !e.target.closest("#town")) {
      suggestions.style.display = "none";
    }
  });
}

// ======================================
// SLUGIFY
// ======================================
function slugify(str = "") {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ======================================
// WASTE LICENCE LOGIC
// ======================================
const wasteLicenceGroup = document.getElementById("wasteLicenceGroup");
const wasteLicenceInput = document.getElementById("wasteLicence");

document.querySelectorAll("input[name='collectsWaste']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    if (e.target.value === "yes") {
      wasteLicenceGroup.style.display = "block";
      wasteLicenceInput.required = true;
    } else {
      wasteLicenceGroup.style.display = "none";
      wasteLicenceInput.required = false;
      wasteLicenceInput.value = "";
    }
  });
});

// ======================================
// KEYWORD SYSTEM
// ======================================
function getSignupKeywords() {
  const inputs = document.querySelectorAll("#signupKeywordEditor input");
  return Array.from(inputs)
    .map(i => i.value.trim().toLowerCase())
    .filter(Boolean);
}

function renderSignupKeywordChips(keywords) {
  const container = document.getElementById("signupKeywordEditor");
  if (!container) return;

  container.innerHTML = "";

  keywords.forEach((kw, index) => {
    const chip = document.createElement("div");
    chip.className = "keyword-chip";

    const input = document.createElement("input");
    input.value = kw;
    input.addEventListener("input", () => {
      // live update only
    });

    const remove = document.createElement("span");
    remove.className = "keyword-remove";
    remove.textContent = "×";

    remove.addEventListener("click", () => {
      const updated = getSignupKeywords();
      updated.splice(index, 1);
      renderSignupKeywordChips(updated);
    });

    chip.appendChild(input);
    chip.appendChild(remove);
    container.appendChild(chip);
  });
}

const addKeywordBtn = document.getElementById("signupAddKeywordBtn");
if (addKeywordBtn) {
  addKeywordBtn.addEventListener("click", () => {
    const current = getSignupKeywords();
    current.push("");
    renderSignupKeywordChips(current);
  });
}

// init
renderSignupKeywordChips([""]);

// ======================================
// FORM SUBMIT
// ======================================
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    isSubmitting = true;

    // reset UI message
    formMessage.textContent = "";
    formMessage.innerHTML = "";
    formMessage.className = "form-message";
    formMessage.style.display = "none";

    submitBtn.disabled = true;
    submitBtn.innerHTML = "Submitting <span class='spinner'></span>";

    try {
      // ======================================
      // COLLECT VALUES
      // ======================================
      const name = document.getElementById("name").value.trim();
      const categoryRaw = document.getElementById("category").value.trim();
      const town = document.getElementById("town").value.trim();
      const email = document.getElementById("email").value.trim();
      const phone = document.getElementById("phone").value.trim();

      let website = document.getElementById("website").value.trim();
      if (website && !website.startsWith("http")) {
        website = `https://${website}`;
      }

      const address = document.getElementById("address").value.trim();
      const description = document.getElementById("description").value.trim();

      const extraKeywords = getSignupKeywords();

      const collectsWaste =
        document.querySelector("input[name='collectsWaste']:checked")?.value || "no";

      const wasteLicence = document.getElementById("wasteLicence").value.trim();
      const consent = document.getElementById("consent").checked;

      const slug = slugify(name);

      // ======================================
      // VALIDATION
      // ======================================
      if (!name || !categoryRaw || !town || !description || !consent) {
        throw new Error("Please fill in all required fields.");
      }

      if (collectsWaste === "yes" && !wasteLicence) {
        throw new Error("Please enter your waste carrier licence number.");
      }

      // ======================================
      // CHECK EXISTENCE
      // ======================================
      const checkRes = await fetch("/.netlify/functions/checkBusinessExists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug })
      });

      const checkData = await checkRes.json();

      if (checkData.exists) {
        throw new Error("This business is already listed or pending approval.");
      }

      // ======================================
      // SUBMIT
      // ======================================
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
        throw new Error(data.error || "Submission failed.");
      }

      // ======================================
      // SUCCESS STATE
      // ======================================
      formMessage.innerHTML = `
        <strong>Thanks — your business has been submitted!</strong>
        <br><br>
        We’ll review it and get it live shortly.
        <br><br>
        Want more customers? We also build simple websites:
        <br>
        <a href="/pricing" class="inline-link">View Website Options →</a>
      `;

      formMessage.classList.add("success");
      formMessage.style.display = "block";

      form.reset();
      wasteLicenceGroup.style.display = "none";
      renderSignupKeywordChips([""]);

    } catch (err) {
      formMessage.textContent = err.message || "Something went wrong.";
      formMessage.classList.add("error");
      formMessage.style.display = "block";

    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Business";
      isSubmitting = false;
    }
  });
    }
