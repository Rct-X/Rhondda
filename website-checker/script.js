// Fade-in animations
window.addEventListener("load", () => {
  document.querySelectorAll(".fade-in").forEach((el, i) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: i * 0.1 });
  });
});

// Elements
const urlInput = document.getElementById("urlInput");
const runCheck = document.getElementById("runCheck");
const results = document.getElementById("results");

const scoreCircle = document.getElementById("scoreCircle");
const gradeEl = document.getElementById("grade");

const criticalCount = document.getElementById("criticalCount");
const improveCount = document.getElementById("improveCount");
const passedCount = document.getElementById("passedCount");

const barGoogle = document.getElementById("barGoogle");
const barLead = document.getElementById("barLead");
const barTrust = document.getElementById("barTrust");
const barMobile = document.getElementById("barMobile");

const lostEnquiries = document.getElementById("lostEnquiries");
const topFixes = document.getElementById("topFixes");

const getReport = document.getElementById("getReport");
const leadCapture = document.getElementById("leadCapture");
const emailInput = document.getElementById("emailInput");
const sendReport = document.getElementById("sendReport");
const thankYou = document.getElementById("thankYou");

let lastResult = null;

// Run check
runCheck.addEventListener("click", async () => {
  const url = urlInput.value.trim();
  if (!url) return alert("Enter a URL");

  results.classList.add("hidden");
  leadCapture.classList.add("hidden");
  thankYou.classList.add("hidden");

  const res = await fetch("/.netlify/functions/check-website", {
    method: "POST",
    body: JSON.stringify({ url })
  });

  const data = await res.json();
  if (!data.ok) return alert(data.error || "Something went wrong");

  lastResult = data;

  // Main score
  scoreCircle.textContent = data.score;
  gradeEl.textContent = data.grade;

  // Counts
  criticalCount.textContent = data.criticalIssues;
  improveCount.textContent = data.improvements;
  passedCount.textContent = data.passedChecks;

  // Bars
  barGoogle.style.width = data.googleVisibility + "%";
  barLead.style.width = data.leadGeneration + "%";
  barTrust.style.width = data.trustCredibility + "%";
  barMobile.style.width = data.mobileExperience + "%";

  // Enquiries lost
  lostEnquiries.textContent = `${data.enquiriesLost}–${data.enquiriesLost + 5} enquiries per month`;

  // Top fixes
  topFixes.innerHTML = "";
  data.topFixes.forEach(fix => {
    const li = document.createElement("li");
    li.textContent = fix;
    topFixes.appendChild(li);
  });

  results.classList.remove("hidden");
});

// Lead capture
getReport.addEventListener("click", () => {
  leadCapture.classList.remove("hidden");
});

// Send report
sendReport.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) return alert("Enter your email");

  const payload = {
    email,
    url: lastResult.url,
    score: lastResult.score,
    grade: lastResult.grade,
    checks: lastResult.checks
  };

  await fetch("/.netlify/functions/send-report", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  leadCapture.classList.add("hidden");
  thankYou.classList.remove("hidden");
});
