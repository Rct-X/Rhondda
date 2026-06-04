async function loadFirebaseConfig() {

  console.log("[INIT] Loading Firebase config...");

  const res = await fetch("/.netlify/functions/firebaseConfig");

  console.log("[INIT] Firebase config response:", res.status);

  if (!res.ok) {
    throw new Error("Failed to load Firebase config");
  }

  return res.json();
}

let db;
let auth;
let storage;

let bizRef;
let business;

let bizId;
let pendingRef;

const MAX_GALLERY_IMAGES = 3;
const MAX_FILE_SIZE_MB = 3;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

/* ===========================
   INIT
=========================== */
(async () => {

  try {

    console.log("[INIT] Starting dashboard init...");

    const config = await loadFirebaseConfig();

    console.log("[INIT] Firebase config loaded");

    if (!firebase.apps.length) {

      firebase.initializeApp(config);

      console.log("[INIT] Firebase app initialised");

    } else {

      console.log("[INIT] Firebase already initialised");
    }

    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();

    console.log("[INIT] Firebase services ready");

    auth.onAuthStateChanged(async (user) => {

      console.log("[AUTH] Auth state changed");

      if (!user) {

        console.log("[AUTH] No user logged in. Redirecting...");

        window.location.href = "/owner-login";

        return;
      }

      console.log("[AUTH] Logged in user:", user.uid);

      try {

        const snap = await db
          .collection("businesses")
          .where("ownerId", "==", user.uid)
          .limit(1)
          .get();

        console.log("[DB] Business query completed");
        console.log("[DB] Matching businesses:", snap.size);

        if (snap.empty) {

          console.warn("[DB] No business found for owner:", user.uid);

          document.getElementById("bizName").textContent =
            "No business found.";

          return;
        }

        bizRef = snap.docs[0].ref;
        bizId = snap.docs[0].id;

        business = snap.docs[0].data();

        console.log("[DB] Business loaded:", business);

        pendingRef = db
          .collection("pending_changes")
          .doc(bizId);

        console.log("[DB] Pending ref ready:", bizId);

        loadOverview();
        loadDetailsForm();
        loadHoursForm();
        loadLogoPreview();
        loadGalleryPreview();
        loadPreview();
        updateGalleryCount();

        await loadPendingNotice();

      } catch (err) {

        console.error("[DB] Failed loading business:", err);
      }

    });

  } catch (err) {

    console.error("[INIT] Fatal init error:", err);
  }

})();

/* ===========================
   TAB SWITCHING
=========================== */
document.querySelectorAll("#sidebar nav button")
  .forEach(btn => {

    btn.addEventListener("click", () => {

      const tab = btn.dataset.tab;

      console.log("[UI] Switching tab:", tab);

      document.querySelectorAll(".tab")
        .forEach(t => t.classList.remove("active"));

      document.getElementById("tab-" + tab)
        .classList.add("active");
    });

  });

/* ===========================
   OVERVIEW
=========================== */
function loadOverview() {

  console.log("[OVERVIEW] Rendering overview");

  document.getElementById("bizName").textContent =
    business.name;

  document.getElementById("bizCategory").textContent =
    business.category;

  document.getElementById("bizTown").textContent =
    business.town;

  document.getElementById("bizStatus").textContent =
    business.verified
      ? "Verified"
      : "Not Verified";
}

/* ===========================
   DETAILS
=========================== */
function loadDetailsForm() {

  console.log("[DETAILS] Loading details form");

  document.getElementById("d-name").value =
    business.name || "";

  document.getElementById("d-description").value =
    business.description || "";

  document.getElementById("d-phone").value =
    business.phone || "";

  document.getElementById("d-address").value =
    business.address || "";

  document.getElementById("d-website").value =
    business.website || "";
}

document.getElementById("detailsForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    console.log("[DETAILS] Saving pending details...");

    try {

      const payload = {
        name: document.getElementById("d-name").value,
        description: document.getElementById("d-description").value,
        phone: document.getElementById("d-phone").value,
        address: document.getElementById("d-address").value,
        website: document.getElementById("d-website").value
      };

      console.log("[DETAILS] Payload:", payload);

      await savePendingChanges(payload);

      document.getElementById("detailsStatus").textContent =
        "Changes sent for approval.";

      console.log("[DETAILS] Pending save complete");

    } catch (err) {

      console.error("[DETAILS] Save failed:", err);

      document.getElementById("detailsStatus").textContent =
        "Save failed.";
    }
  });

/* ===========================
   HOURS
=========================== */
function loadHoursForm() {

  console.log("[HOURS] Loading hours");

  const h = business.hours || {};

  document.getElementById("h-mon").value =
    h.Monday || "";

  document.getElementById("h-tue").value =
    h.Tuesday || "";

  document.getElementById("h-wed").value =
    h.Wednesday || "";

  document.getElementById("h-thu").value =
    h.Thursday || "";

  document.getElementById("h-fri").value =
    h.Friday || "";

  document.getElementById("h-sat").value =
    h.Saturday || "";

  document.getElementById("h-sun").value =
    h.Sunday || "";
}

document.getElementById("hoursForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    console.log("[HOURS] Saving pending hours...");

    try {

      const hours = {

        Monday:
          document.getElementById("h-mon").value,

        Tuesday:
          document.getElementById("h-tue").value,

        Wednesday:
          document.getElementById("h-wed").value,

        Thursday:
          document.getElementById("h-thu").value,

        Friday:
          document.getElementById("h-fri").value,

        Saturday:
          document.getElementById("h-sat").value,

        Sunday:
          document.getElementById("h-sun").value
      };

      console.log("[HOURS] Payload:", hours);

      await savePendingChanges({ hours });

      document.getElementById("hoursStatus").textContent =
        "Hours sent for approval.";

      console.log("[HOURS] Pending save complete");

    } catch (err) {

      console.error("[HOURS] Save failed:", err);

      document.getElementById("hoursStatus").textContent =
        "Hours update failed.";
    }
  });

/* ===========================
   GALLERY COUNT
=========================== */
function updateGalleryCount() {

  const current =
    (business.gallery || []).length;

  document.getElementById("galleryCount")
    .textContent =
    `${current}/${MAX_GALLERY_IMAGES} images used`;
}

/* ===========================
   IMAGE COMPRESSION
=========================== */
function compressImage(file, maxSize = 800) {

  console.log("[IMAGE] Compressing:", file.name);

  return new Promise(resolve => {

    const img = new Image();

    img.onload = () => {

      const canvas =
        document.createElement("canvas");

      const scale =
        maxSize / Math.max(img.width, img.height);

      canvas.width =
        img.width * scale;

      canvas.height =
        img.height * scale;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(blob => {

        console.log("[IMAGE] Compression complete");

        resolve(blob);

      }, "image/jpeg", 0.8);
    };

    img.src =
      URL.createObjectURL(file);
  });
}

/* ===========================
   LOGO PREVIEW
=========================== */
function loadLogoPreview() {

  console.log("[LOGO] Loading logo preview");

  const preview =
    document.getElementById("logoPreview");

  if (business.logoUrl) {

    preview.src =
      business.logoUrl;

    preview.style.display =
      "block";

    console.log("[LOGO] Logo loaded");

  } else {

    preview.style.display =
      "none";

    console.log("[LOGO] No logo found");
  }
}

/* ===========================
   LOGO UPLOAD
=========================== */
document.getElementById("uploadLogoBtn")
  .addEventListener("click", async () => {

    try {

      const file =
        document.getElementById("logoInput").files[0];

      if (!file) {

        console.warn("[LOGO] No file selected");

        return;
      }

      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type)
      ) {

        document.getElementById("logoStatus")
          .textContent =
          "Only JPG, PNG or WEBP allowed.";

        return;
      }

      if (
        file.size >
        MAX_FILE_SIZE_MB * 1024 * 1024
      ) {

        document.getElementById("logoStatus")
          .textContent =
          `Logo exceeds ${MAX_FILE_SIZE_MB}MB`;

        return;
      }

      console.log("[LOGO] Upload starting:", file.name);

      const compressed =
        await compressImage(file);

      const ref =
        storage.ref(`logos/${business.slug}.jpg`);

      await ref.put(compressed);

      console.log("[LOGO] Upload complete");

      const url =
        await ref.getDownloadURL();

      console.log("[LOGO] Download URL:", url);

      await savePendingChanges({
        logoUrl: url
      });

      business.logoUrl = url;

      loadLogoPreview();
      loadPreview();

      document.getElementById("logoStatus").textContent =
        "Logo sent for approval.";

      console.log("[LOGO] Pending logo saved");

    } catch (err) {

      console.error("[LOGO] Upload failed:", err);

      document.getElementById("logoStatus").textContent =
        "Logo upload failed.";
    }
  });

/* ===========================
   GALLERY PREVIEW
=========================== */
function loadGalleryPreview() {

  console.log("[GALLERY] Loading gallery");

  const container =
    document.getElementById("galleryPreview");

  if (
    !business.gallery ||
    business.gallery.length === 0
  ) {

    container.innerHTML =
      "<p>No images uploaded yet.</p>";

    console.log("[GALLERY] Empty gallery");

    return;
  }

  container.innerHTML = "";

  business.gallery.forEach((url, index) => {

    // WRAPPER
    const wrapper =
      document.createElement("div");

    wrapper.className =
      "gallery-item";

    // IMAGE
    const img =
      document.createElement("img");

    img.src = url;

    img.className =
      "gallery-thumb";

    // DELETE BUTTON
    const removeBtn =
      document.createElement("button");

    removeBtn.className =
      "gallery-delete";

    removeBtn.innerHTML = "×";

    removeBtn.title =
      "Remove image";

    // DELETE CLICK
    removeBtn.addEventListener(
      "click",
      () => {

        const confirmed =
          confirm(
            "Remove this image? You can upload another after saving."
          );

        if (!confirmed) return;

        // REMOVE IMAGE
        business.gallery.splice(index, 1);

        console.log(
          "[GALLERY] Image removed locally"
        );

        // REFRESH UI
        loadGalleryPreview();
        updateGalleryCount();

        document.getElementById(
          "galleryStatus"
        ).textContent =
          "Image removed. Click upload to save changes.";
      }
    );

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);

    container.appendChild(wrapper);
  });

  console.log(
    "[GALLERY] Gallery images:",
    business.gallery.length
  );
}

/* ===========================
   GALLERY UPLOAD
=========================== */
document.getElementById("uploadGalleryBtn")
  .addEventListener("click", async () => {

    try {

      const files =
        document.getElementById("galleryInput").files;

      const existingCount =
        (business.gallery || []).length;

      if (
        existingCount >= MAX_GALLERY_IMAGES
      ) {

        document.getElementById("galleryStatus")
          .textContent =
          `You already reached the ${MAX_GALLERY_IMAGES} image limit.`;

        return;
      }

      if (
        existingCount + files.length >
        MAX_GALLERY_IMAGES
      ) {

        const remaining =
          MAX_GALLERY_IMAGES - existingCount;

        document.getElementById("galleryStatus")
          .textContent =
          `You can only upload ${remaining} more image(s).`;

        return;
      }

      for (const file of files) {

        if (
          !ALLOWED_IMAGE_TYPES.includes(file.type)
        ) {

          document.getElementById("galleryStatus")
            .textContent =
            `${file.name} is not a supported image type`;

          return;
        }

        if (
          file.size >
          MAX_FILE_SIZE_MB * 1024 * 1024
        ) {

          document.getElementById("galleryStatus")
            .textContent =
            `${file.name} exceeds ${MAX_FILE_SIZE_MB}MB`;

          return;
        }
      }

      if (!files.length) {

        console.warn("[GALLERY] No files selected");

        return;
      }

      console.log(
        "[GALLERY] Uploading files:",
        files.length
      );

      const gallery = [...(business.gallery || [])];

      for (let file of files) {

        console.log(
          "[GALLERY] Processing:",
          file.name
        );

        const compressed =
          await compressImage(file);

        const id =
          Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .slice(2);

        const ref =
          storage.ref(
            `gallery/${business.slug}/${id}.jpg`
          );

        await ref.put(compressed);

        const url =
          await ref.getDownloadURL();

        gallery.push(url);

        console.log(
          "[GALLERY] Uploaded:",
          url
        );
      }

      await savePendingChanges({
        gallery
      });
      

      business.gallery = gallery;

      updateGalleryCount();
      loadGalleryPreview();
      loadPreview();

      document.getElementById("galleryStatus").textContent =
        "Images sent for approval.";

      console.log(
        "[GALLERY] Pending gallery saved"
      );

    } catch (err) {

      console.error(
        "[GALLERY] Upload failed:",
        err
      );

      document.getElementById("galleryStatus").textContent =
        "Gallery upload failed.";
    }
  });

/* ===========================
   SAVE PENDING CHANGES
=========================== */
async function savePendingChanges(partial) {

  try {

    console.log(
      "[PENDING] Saving pending changes:",
      partial
    );

    const user = auth.currentUser;

    if (!user) {

      throw new Error(
        "No authenticated user"
      );
    }

    if (!pendingRef) {

      throw new Error(
        "Pending reference not initialised"
      );
    }

    await pendingRef.set(
      {
        ...partial,

        ownerId: user.uid,

        businessId: bizId,

        status: "pending",

        submittedAt:
          firebase.firestore.FieldValue
            .serverTimestamp()
      },
      { merge: true }
    );

    console.log(
      "[PENDING] Pending changes saved"
    );

    const notice =
      document.getElementById(
        "pendingNotice"
      );

    if (notice) {

      notice.textContent =
        "Changes saved and awaiting approval.";
    }

  } catch (err) {

    console.error(
      "[PENDING] Save failed:",
      err
    );

    throw err;
  }
}

/* ===========================
   PREVIEW
=========================== */
function loadPreview() {

  console.log("[PREVIEW] Rendering preview");

  const h =
    business.hours || {};

  const gallery =
    business.gallery || [];

  const hoursHtml =
    Object.entries(h)
      .map(([day, value]) => `
        <li>
          <strong>${day}:</strong>
          ${value || "Closed"}
        </li>
      `)
      .join("");

  const galleryHtml =
    gallery.length
      ? gallery.map(url => `
          <img
            src="${url}"
            class="preview-gallery-img"
          >
        `).join("")
      : "<p>No gallery images uploaded.</p>";

  const html = `

    <!-- LOGO -->
    <div class="preview-logo-wrap">

      ${
        business.logoUrl
          ? `
            <img
              src="${business.logoUrl}"
              class="preview-logo"
            >
          `
          : `
            <div class="preview-no-logo">
              No Logo
            </div>
          `
      }

    </div>

    <!-- NAME -->
    <h2 class="preview-name">
      ${business.name}
    </h2>

    <!-- CATEGORY -->
    <p class="preview-category">
      ${business.category}
      •
      ${business.town}
    </p>

    <!-- GALLERY -->
    <section class="preview-section">

      <h3>Gallery</h3>

      <div class="preview-gallery">
        ${galleryHtml}
      </div>

    </section>

    <!-- ABOUT -->
    <section class="preview-section">

      <h3>About</h3>

      <p>
        ${business.description || "No description added yet."}
      </p>

    </section>

    <!-- CONTACT -->
    <section class="preview-section">

      <h3>Contact</h3>

      <p>
        <strong>Phone:</strong>
        ${business.phone || "Not provided"}
      </p>

      <p>
        <strong>Address:</strong>
        ${business.address || "Not provided"}
      </p>

      <p>
        <strong>Website:</strong>
        ${
          business.website
            ? `
              <a
                href="${business.website}"
                target="_blank"
              >
                ${business.website}
              </a>
            `
            : "Not provided"
        }
      </p>

    </section>

    <!-- OPENING HOURS -->
    <section class="preview-section">

      <h3>Opening Hours</h3>

      <ul class="preview-hours">
        ${hoursHtml}
      </ul>

    </section>
  `;

  document.getElementById("previewArea")
    .innerHTML = html;
}

/* ===========================
   PENDING NOTICE
=========================== */
async function loadPendingNotice() {

  try {

    console.log(
      "[PENDING] Checking pending status"
    );

    const snap =
      await pendingRef.get();

    if (!snap.exists) {

      console.log(
        "[PENDING] No pending document"
      );

      return;
    }

    const p =
      snap.data();

    console.log(
      "[PENDING] Pending data:",
      p
    );

    if (p.status === "pending") {

      document.getElementById("pendingNotice")
        .textContent =
        "You have changes waiting for approval. Your live listing will update once approved.";

      console.log(
        "[PENDING] Pending notice shown"
      );
    }

  } catch (err) {

    console.error(
      "[PENDING] Failed loading notice:",
      err
    );
  }
}

/* ===========================
   LOGOUT
=========================== */
document.getElementById("logoutBtn")
  .addEventListener("click", async () => {

    console.log("[AUTH] Signing out...");

    await auth.signOut();

    console.log("[AUTH] Signed out");
  });
