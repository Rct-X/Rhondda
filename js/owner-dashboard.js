async function loadFirebaseConfig() {
  console.log("[INIT] Loading Firebase config...");

  const res = await fetch("/.netlify/functions/firebaseConfig");

  console.log("[INIT] Firebase config response:", res.status);

  if (!res.ok) {
    throw new Error("Failed to load Firebase config");
  }

  return res.json();
}

let db, auth, storage, bizRef, business;

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

        const snap = await db.collection("businesses")
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
        business = snap.docs[0].data();

        console.log("[DB] Business loaded:", business);

        loadOverview();
        loadDetailsForm();
        loadHoursForm();
        loadLogoPreview();
        loadGalleryPreview();

      } catch (err) {
        console.error("[DB] Failed loading business:", err);
      }

    });

  } catch (err) {
    console.error("[INIT] Fatal init error:", err);
  }
})();

/* ---------------------------
   TAB SWITCHING
---------------------------- */
document.querySelectorAll("#sidebar nav button").forEach(btn => {

  btn.addEventListener("click", () => {

    const tab = btn.dataset.tab;

    console.log("[UI] Switching tab:", tab);

    document.querySelectorAll(".tab")
      .forEach(t => t.classList.remove("active"));

    document.getElementById("tab-" + tab)
      .classList.add("active");
  });

});

/* ---------------------------
   OVERVIEW
---------------------------- */
function loadOverview() {

  console.log("[OVERVIEW] Rendering overview");

  document.getElementById("bizName").textContent =
    business.name;

  document.getElementById("bizCategory").textContent =
    business.category;

  document.getElementById("bizTown").textContent =
    business.town;

  document.getElementById("bizStatus").textContent =
    business.verified ? "Verified" : "Not Verified";
}

/* ---------------------------
   DETAILS
---------------------------- */
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

    console.log("[DETAILS] Saving details...");

    try {

      const payload = {
        name: document.getElementById("d-name").value,
        description: document.getElementById("d-description").value,
        phone: document.getElementById("d-phone").value,
        address: document.getElementById("d-address").value,
        website: document.getElementById("d-website").value
      };

      console.log("[DETAILS] Payload:", payload);

      await bizRef.update(payload);

      console.log("[DETAILS] Update successful");

      document.getElementById("detailsStatus").textContent =
        "Saved!";

    } catch (err) {

      console.error("[DETAILS] Update failed:", err);

      document.getElementById("detailsStatus").textContent =
        "Save failed.";
    }
});

/* ---------------------------
   HOURS
---------------------------- */
function loadHoursForm() {

  console.log("[HOURS] Loading hours");

  const h = business.hours || {};

  document.getElementById("h-mon").value = h.Monday || "";
  document.getElementById("h-tue").value = h.Tuesday || "";
  document.getElementById("h-wed").value = h.Wednesday || "";
  document.getElementById("h-thu").value = h.Thursday || "";
  document.getElementById("h-fri").value = h.Friday || "";
  document.getElementById("h-sat").value = h.Saturday || "";
  document.getElementById("h-sun").value = h.Sunday || "";
}

document.getElementById("hoursForm")
  .addEventListener("submit", async (e) => {

    e.preventDefault();

    console.log("[HOURS] Saving opening hours...");

    try {

      const payload = {
        hours: {
          Monday: document.getElementById("h-mon").value,
          Tuesday: document.getElementById("h-tue").value,
          Wednesday: document.getElementById("h-wed").value,
          Thursday: document.getElementById("h-thu").value,
          Friday: document.getElementById("h-fri").value,
          Saturday: document.getElementById("h-sat").value,
          Sunday: document.getElementById("h-sun").value
        }
      };

      console.log("[HOURS] Payload:", payload);

      await bizRef.update(payload);

      console.log("[HOURS] Hours updated");

      document.getElementById("hoursStatus").textContent =
        "Hours updated!";

    } catch (err) {

      console.error("[HOURS] Update failed:", err);

      document.getElementById("hoursStatus").textContent =
        "Hours update failed.";
    }
});

/* ---------------------------
   IMAGE COMPRESSION
---------------------------- */
function compressImage(file, maxSize = 800) {

  console.log("[IMAGE] Compressing:", file.name);

  return new Promise(resolve => {

    const img = new Image();

    img.onload = () => {

      const canvas = document.createElement("canvas");

      const scale =
        maxSize / Math.max(img.width, img.height);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");

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

    img.src = URL.createObjectURL(file);
  });
}

/* ---------------------------
   LOGO PREVIEW
---------------------------- */
function loadLogoPreview() {

  console.log("[LOGO] Loading logo preview");

  const preview =
    document.getElementById("logoPreview");

  if (business.logoUrl) {

    preview.src = business.logoUrl;
    preview.style.display = "block";

    console.log("[LOGO] Logo loaded");

  } else {

    preview.style.display = "none";

    console.log("[LOGO] No logo found");
  }
}

/* ---------------------------
   LOGO UPLOAD
---------------------------- */
document.getElementById("uploadLogoBtn")
  .addEventListener("click", async () => {

    try {

      const file =
        document.getElementById("logoInput").files[0];

      if (!file) {
        console.warn("[LOGO] No file selected");
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

      await bizRef.update({
        logoUrl: url
      });

      business.logoUrl = url;

      loadLogoPreview();

      document.getElementById("logoStatus").textContent =
        "Logo uploaded!";

    } catch (err) {

      console.error("[LOGO] Upload failed:", err);

      document.getElementById("logoStatus").textContent =
        "Logo upload failed.";
    }
});

/* ---------------------------
   GALLERY PREVIEW
---------------------------- */
function loadGalleryPreview() {

  console.log("[GALLERY] Loading gallery");

  const container =
    document.getElementById("galleryPreview");

  if (!business.gallery || business.gallery.length === 0) {

    container.innerHTML =
      "<p>No images uploaded yet.</p>";

    console.log("[GALLERY] Empty gallery");

    return;
  }

  container.innerHTML = "";

  business.gallery.forEach(url => {

    const img = document.createElement("img");

    img.src = url;

    container.appendChild(img);
  });

  console.log(
    "[GALLERY] Gallery images:",
    business.gallery.length
  );
}

/* ---------------------------
   GALLERY UPLOAD
---------------------------- */
document.getElementById("uploadGalleryBtn")
  .addEventListener("click", async () => {

    try {

      const files =
        document.getElementById("galleryInput").files;

      if (!files.length) {
        console.warn("[GALLERY] No files selected");
        return;
      }

      console.log(
        "[GALLERY] Uploading files:",
        files.length
      );

      const gallery =
        business.gallery || [];

      for (let file of files) {

        console.log("[GALLERY] Processing:", file.name);

        const compressed =
          await compressImage(file);

        const id =
          Date.now() +
          "-" +
          Math.random().toString(36).slice(2);

        const ref =
          storage.ref(
            `gallery/${business.slug}/${id}.jpg`
          );

        await ref.put(compressed);

        const url =
          await ref.getDownloadURL();

        gallery.push(url);

        console.log("[GALLERY] Uploaded:", url);
      }

      await bizRef.update({ gallery });

      business.gallery = gallery;

      loadGalleryPreview();

      document.getElementById("galleryStatus").textContent =
        "Images uploaded!";

      console.log("[GALLERY] Gallery update complete");

    } catch (err) {

      console.error("[GALLERY] Upload failed:", err);

      document.getElementById("galleryStatus").textContent =
        "Gallery upload failed.";
    }
});

/* ---------------------------
   LOGOUT
---------------------------- */
document.getElementById("logoutBtn")
  .addEventListener("click", async () => {

    console.log("[AUTH] Signing out...");

    await auth.signOut();

    console.log("[AUTH] Signed out");
});
