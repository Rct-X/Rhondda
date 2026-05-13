<!-- =========================
COOKIE / PRIVACY NOTICE
========================= -->

<style>
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

.privacy-box h2{
    margin-bottom:1rem;
}

.privacy-box h3{
    margin-top:1.5rem;
    margin-bottom:.5rem;
    color:#93c5fd;
}

.privacy-box p{
    color:rgba(255,255,255,0.82);
    line-height:1.7;
    margin-bottom:1rem;
}

.close-policy{
    margin-top:1rem;
    background:#2563eb;
    color:#fff;
    border:none;
    padding:.8rem 1rem;
    border-radius:10px;
    cursor:pointer;
    font-weight:600;
}

.footer-links{
    margin-top:1rem;
    font-size:.9rem;
}

.footer-links button{
    background:none;
    border:none;
    color:#2563eb;
    cursor:pointer;
    font-weight:600;
}

@media(max-width:768px){
    .cookie-banner{
        left:12px;
        right:12px;
        bottom:12px;
    }
}
</style>

<!-- COOKIE BANNER -->
<div class="cookie-banner" id="cookieBanner">
    <p>
        This website uses basic analytics and local storage to help improve performance, monitor visits, and understand how visitors use the site. By continuing to use this website, you agree to this use.
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

<!-- PRIVACY POLICY MODAL -->
<div class="privacy-modal" id="privacyModal">
    <div class="privacy-box">

        <h2>Privacy Policy</h2>

        <p>
            RCTX respects your privacy and is committed to protecting any information you provide through this website.
        </p>

        <h3>Information We Collect</h3>

        <p>
            When you submit a contact form, we may collect:
        </p>

        <p>
            • Name<br>
            • Phone number<br>
            • Email address<br>
            • Business information<br>
            • Any details you submit through the enquiry form
        </p>

        <h3>How We Use Your Information</h3>

        <p>
            We use submitted information to:
        </p>

        <p>
            • Respond to enquiries<br>
            • Provide website services<br>
            • Communicate regarding projects or support
        </p>

        <h3>Analytics & Tracking</h3>

        <p>
            This website uses lightweight analytics to monitor visits, page views, device types, and general traffic information. No sensitive personal information is collected through analytics tracking.
        </p>

        <h3>Cookies & Local Storage</h3>

        <p>
            This website may use browser storage and basic cookies for functionality, analytics, and remembering visitor preferences.
        </p>

        <h3>Third-Party Services</h3>

        <p>
            This website may use trusted third-party providers including hosting, analytics, form handling, and security services.
        </p>

        <h3>Your Rights</h3>

        <p>
            You may request access, correction, or deletion of your personal data at any time by contacting us directly.
        </p>

        <h3>Contact</h3>

        <p>
            Email: support@rctx.co.uk
        </p>

        <button class="close-policy" id="closePolicy">
            Close
        </button>

    </div>
</div>

<script>
// =========================
// COOKIE CONSENT
// =========================
const cookieBanner = document.getElementById("cookieBanner");
const acceptCookies = document.getElementById("acceptCookies");

if(!localStorage.getItem("rctx_cookie_consent")){
    cookieBanner.style.display = "block";
}

acceptCookies.onclick = () => {
    localStorage.setItem("rctx_cookie_consent", "accepted");
    cookieBanner.style.display = "none";
};

// =========================
// PRIVACY POLICY MODAL
// =========================
const privacyModal = document.getElementById("privacyModal");
const openPolicy = document.getElementById("openPolicy");
const closePolicy = document.getElementById("closePolicy");

openPolicy.onclick = () => {
    privacyModal.style.display = "flex";
};

closePolicy.onclick = () => {
    privacyModal.style.display = "none";
};

privacyModal.onclick = (e) => {
    if(e.target === privacyModal){
        privacyModal.style.display = "none";
    }
};
</script>
