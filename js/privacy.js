const style = document.createElement("style");

style.textContent = `
.cookie-banner{
    position:fixed;
    bottom:20px;
    left:20px;
    right:20px;
    max-width:520px;
    background:#111827;
    border:1px solid rgba(255,255,255,0.08);
    border-radius:18px;
    padding:1.3rem;
    z-index:99999;
    box-shadow:0 10px 40px rgba(0,0,0,0.45);
    color:#fff;
    display:none;
}

.cookie-banner p{
    font-size:.92rem;
    line-height:1.6;
    color:rgba(255,255,255,0.82);
    margin-bottom:1rem;
}

.cookie-actions{
    display:flex;
    gap:.8rem;
    flex-wrap:wrap;
}

.cookie-btn{
    border:none;
    cursor:pointer;
    border-radius:10px;
    padding:.8rem 1rem;
    font-weight:600;
    font-size:.92rem;
}

.cookie-accept{
    background:#2563eb;
    color:#fff;
}

.cookie-policy{
    background:transparent;
    border:1px solid rgba(255,255,255,0.15);
    color:#fff;
}

.privacy-modal{
    position:fixed;
    inset:0;
    background:rgba(0,0,0,0.75);
    display:none;
    align-items:center;
    justify-content:center;
    z-index:100000;
    padding:1rem;
}

.privacy-box{
    background:#0f172a;
    border:1px solid rgba(255,255,255,0.08);
    border-radius:18px;
    max-width:800px;
    width:100%;
    max-height:85vh;
    overflow:auto;
    padding:2rem;
    color:#fff;
}

.close-policy{
    margin-top:1rem;
    background:#2563eb;
    color:#fff;
    border:none;
    padding:.8rem 1rem;
    border-radius:10px;
    cursor:pointer;
}
`;

document.head.appendChild(style);

document.body.insertAdjacentHTML("beforeend", `
<div class="cookie-banner" id="cookieBanner">
    <p>
        This website uses basic analytics and local storage.
    </p>

    <div class="cookie-actions">
        <button class="cookie-btn cookie-accept" id="acceptCookies">
            Accept
        </button>

        <button class="cookie-btn cookie-policy" id="openPolicy">
            Privacy Policy
        </button>
    </div>
</div>

<div class="privacy-modal" id="privacyModal">
    <div class="privacy-box">

        <h2>Privacy Policy</h2>

        <p>
            RCTX respects your privacy.
        </p>

        <p>
            Contact: support@rctx.co.uk
        </p>

        <button class="close-policy" id="closePolicy">
            Close
        </button>

    </div>
</div>
`);

const cookieBanner = document.getElementById("cookieBanner");

if(!localStorage.getItem("rctx_cookie_consent")){
    cookieBanner.style.display = "block";
}

document.getElementById("acceptCookies").onclick = () => {
    localStorage.setItem("rctx_cookie_consent", "accepted");
    cookieBanner.style.display = "none";
};

document.getElementById("openPolicy").onclick = () => {
    document.getElementById("privacyModal").style.display = "flex";
};

document.getElementById("closePolicy").onclick = () => {
    document.getElementById("privacyModal").style.display = "none";
};
