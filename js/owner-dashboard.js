async function loadFirebaseConfig() {
  const res = await fetch("/.netlify/functions/firebaseConfig");
  return res.json();
}

let db, auth, storage, bizRef, business;

(async () => {
  const config = await loadFirebaseConfig();
  firebase.initializeApp(config);

  db = firebase.firestore();
  auth = firebase.auth();
  storage = firebase.storage();

  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "/owner-login";
      return;
    }

    const snap = await db.collection("businesses")
      .where("ownerId", "==", user.uid)
      .limit(1)
      .get();

    if (snap.empty) {
      document.getElementById("bizName").textContent = "No business found.";
      return;
    }

    bizRef = snap.docs[0].ref;
    business = snap.docs[0].data();

    loadOverview();
    loadDetailsForm();
    loadHoursForm();
  });
})();

// TAB SWITCHING
document.querySelectorAll("#sidebar nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.getElementById("tab-" + tab).classList.add("active");
  });
});

// OVERVIEW
function loadOverview() {
  document.getElementById("bizName").textContent = business.name;
  document.getElementById("bizCategory").textContent = business.category;
  document.getElementById("bizTown").textContent = business.town;
  document.getElementById("bizStatus").textContent = business.verified ? "Verified" : "Not Verified";
}

// DETAILS
function loadDetailsForm() {
  document.getElementById("d-name").value = business.name;
  document.getElementById("d-description").value = business.description || "";
  document.getElementById("d-phone").value = business.phone || "";
  document.getElementById("d-address").value = business.address || "";
  document.getElementById("d-website").value = business.website || "";
}

document.getElementById("detailsForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await bizRef.update({
    name: document.getElementById("d-name").value,
    description: document.getElementById("d-description").value,
    phone: document.getElementById("d-phone").value,
    address: document.getElementById("d-address").value,
    website: document.getElementById("d-website").value
  });

  document.getElementById("detailsStatus").textContent = "Saved!";
});

// HOURS
function loadHoursForm() {
  const h = business.hours || {};
  document.getElementById("h-mon").value = h.Monday || "";
  document.getElementById("h-tue").value = h.Tuesday || "";
  document.getElementById("h-wed").value = h.Wednesday || "";
  document.getElementById("h-thu").value = h.Thursday || "";
  document.getElementById("h-fri").value = h.Friday || "";
  document.getElementById("h-sat").value = h.Saturday || "";
  document.getElementById("h-sun").value = h.Sunday || "";
}

document.getElementById("hoursForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await bizRef.update({
    hours: {
      Monday: document.getElementById("h-mon").value,
      Tuesday: document.getElementById("h-tue").value,
      Wednesday: document.getElementById("h-wed").value,
      Thursday: document.getElementById("h-thu").value,
      Friday: document.getElementById("h-fri").value,
      Saturday: document.getElementById("h-sat").value,
      Sunday: document.getElementById("h-sun").value
    }
  });

  document.getElementById("hoursStatus").textContent = "Hours updated!";
});

// IMAGE COMPRESSION
function compressImage(file, maxSize = 800) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = maxSize / Math.max(img.width, img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(blob => resolve(blob), "image/jpeg", 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

// LOGO UPLOAD
document.getElementById("uploadLogoBtn").addEventListener("click", async () => {
  const file = document.getElementById("logoInput").files[0];
  if (!file) return;

  const compressed = await compressImage(file);

  const ref = storage.ref(`logos/${business.slug}.jpg`);
  await ref.put(compressed);

  const url = await ref.getDownloadURL();
  await bizRef.update({ logoUrl: url });

  document.getElementById("logoPreview").src = url;
  document.getElementById("logoStatus").textContent = "Logo uploaded!";
});

// GALLERY UPLOAD
document.getElementById("uploadGalleryBtn").addEventListener("click", async () => {
  const files = document.getElementById("galleryInput").files;
  if (!files.length) return;

  const gallery = business.gallery || [];

  for (let file of files) {
    const compressed = await compressImage(file);
    const id = Date.now() + "-" + Math.random().toString(36).slice(2);

    const ref = storage.ref(`gallery/${business.slug}/${id}.jpg`);
    await ref.put(compressed);

    const url = await ref.getDownloadURL();
    gallery.push(url);
  }

  await bizRef.update({ gallery });

  document.getElementById("galleryStatus").textContent = "Images uploaded!";
});

// LOGOUT
document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut();
});
