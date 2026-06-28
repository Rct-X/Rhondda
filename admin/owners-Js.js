let db;

// ======================================
// INIT
// ======================================
export function initOwners({ db: firestore, container }) {

    db = firestore;

    container.innerHTML = `

        <div class="page-header">
            <h1>Owners</h1>
            <p>Manage holiday let owners.</p>
        </div>

        <div id="ownersList" class="owners-list">

            <div class="loading">
                Loading owners...
            </div>

        </div>

    `;

    loadOwners();

}

// ======================================
// LOAD OWNERS
// ======================================
async function loadOwners() {

    const wrap =
        document.getElementById("ownersList");

    wrap.innerHTML = "";

    const snap =
        await db
            .collection("users")
            .orderBy("email")
            .get();

    if (snap.empty) {

        wrap.innerHTML =
            "<p>No owners have logged in yet.</p>";

        return;

    }

    for (const doc of snap.docs) {

        const owner = doc.data();

        const propertySnap =
            await db
                .collection("properties")
                .where("ownerId", "==", owner.uid)
                .limit(1)
                .get();

        const property =
            propertySnap.empty
                ? "No property assigned"
                : propertySnap.docs[0].data().hero.title;

        wrap.innerHTML += `

            <div class="owner-card">

                <h3>${owner.displayName}</h3>

                <p>${owner.email}</p>

                <p>
                    <strong>Property:</strong>
                    ${property}
                </p>

                <button
                    class="btn btn-primary assign-btn"
                    data-uid="${owner.uid}"
                >
                    Assign Property
                </button>

            </div>

        `;

    }

}
