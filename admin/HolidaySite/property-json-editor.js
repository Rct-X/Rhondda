let db;
let auth;

export function initPropertyJsonEditor({ db: _db, auth: _auth, container }) {
  db = _db;
  auth = _auth;

  container.innerHTML = `
    <div class="page-header">
      <h1>Property JSON Editor</h1>
      <p>Edit full property data directly</p>
    </div>

    <div class="field">
      <label>Property ID</label>
      <input id="propertyId">
      <button id="loadBtn" class="btn btn-secondary">Load</button>
    </div>

    <hr>

    <textarea id="jsonInput" rows="25" style="width:100%;"></textarea>

    <button id="saveBtn" class="btn btn-primary">Save</button>

    <pre id="status"></pre>
  `;

  bind();
}

function bind() {

  document.addEventListener("click", async (e) => {

    if (e.target.id === "loadBtn") {
      await load();
    }

    if (e.target.id === "saveBtn") {
      await save();
    }

  });

}

async function load() {
  const id = document.getElementById("propertyId").value.trim();
  if (!id) return;

  const doc = await db.collection("properties").doc(id).get();

  if (!doc.exists) return alert("Not found");

  document.getElementById("jsonInput").value =
    JSON.stringify(doc.data(), null, 2);
}

async function save() {

  const id = document.getElementById("propertyId").value.trim();
  const raw = document.getElementById("jsonInput").value;

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    return alert("Invalid JSON");
  }

  await db.collection("properties")
    .doc(id)
    .set(data, { merge: true });

  document.getElementById("status").textContent = "Saved";
}
