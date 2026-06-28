let db;
let container;

export function initOwners({ db: firestore, container: el }) {
  db = firestore;
  container = el;

  render();
}

async function render() {

  container.innerHTML = `
    <div class="page-header">
      <h1>Property Owners</h1>
      <p>Manage owner assignments</p>
    </div>

    <div id="ownersList">Loading...</div>
  `;

  const wrap = document.getElementById("ownersList");

  const snap = await db.collection("properties").get();

  wrap.innerHTML = "";

  snap.forEach(doc => {
    const p = doc.data();
    const assigned = !!p.ownerId;

    wrap.innerHTML += `
      <div class="owner-card">
        <h2>${p.hero?.title || "Untitled"}</h2>

        <p><strong>Status:</strong>
          ${assigned ? "🟢 Assigned" : "🔴 None"}
        </p>

        <p><strong>Email:</strong> ${p.ownerEmail || "-"}</p>
        <p><strong>UID:</strong> ${p.ownerId || "-"}</p>

        <button class="btn btn-primary assign-owner-btn"
                data-id="${doc.id}">
          ${assigned ? "Change Owner" : "Create Owner"}
        </button>
      </div>
    `;
  });

}
