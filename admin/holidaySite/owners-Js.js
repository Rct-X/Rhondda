let db;

// ======================================
// INIT
// ======================================

export function initOwners({ db: firestore, container }) {

    db = firestore;

    container.innerHTML = `

        <div class="page-header">

            <h1>Property Owners</h1>

            <p>
                Create and manage owner accounts for every holiday let.
            </p>

        </div>

        <div id="ownersList" class="owners-list">

            Loading properties...

        </div>

    `;

    loadProperties();

}

// ======================================
// LOAD PROPERTIES
// ======================================

async function loadProperties() {

    const wrap =
        document.getElementById("ownersList");

    wrap.innerHTML = "";

    const snap =
        await db
            .collection("properties")
            .orderBy("hero.title")
            .get();

    if (snap.empty) {

        wrap.innerHTML = `
            <p>No properties found.</p>
        `;

        return;

    }

    snap.forEach(doc => {

        const property = doc.data();

        const assigned =
            property.ownerId ? true : false;

        wrap.innerHTML += `

            <div class="owner-card">

                <h2>

                    ${property.hero?.title || "Untitled Property"}

                </h2>

                <p>

                    <strong>Status:</strong>

                    ${assigned
                        ? "🟢 Owner Assigned"
                        : "🔴 No Owner"}

                </p>

                <p>

                    <strong>Email:</strong>

                    ${property.ownerEmail || "-"}

                </p>

                <p>

                    <strong>UID:</strong>

                    ${property.ownerId || "-"}

                </p>

                ${
                    assigned

                    ?

                    `

                    <button
                        class="btn btn-secondary manage-owner"
                        data-id="${doc.id}">

                        Manage Owner

                    </button>

                    `

                    :

                    `

                    <button
                        class="btn btn-primary create-owner"
                        data-id="${doc.id}">

                        Create Owner

                    </button>

                    `

                }

            </div>

        `;

    });

}
