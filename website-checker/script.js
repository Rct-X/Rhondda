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
const barConversions = document.getElementById("barConversions");

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
  if (!url) return alert("Please enter a website");

  // Reset UI
  results.classList.add("hidden");
  leadCapture.classList.add("hidden");
  thankYou.classList.add("hidden");

  const limitInfo = document.getElementById("limitInfo");
  const limitInfoResults = document.getElementById("limitInfoResults");

  limitInfo.style.display = "none";
  limitInfoResults.style.display = "none";

  const res = await fetch("/.netlify/functions/check-website", {
    method: "POST",
    body: JSON.stringify({ url })
  });

  const data = await res.json();

  // Handle rate limits
  if (!data.ok) {
    let msg = data.error;

    if (data.remainingDaily !== undefined) {
      msg += ` (${data.remainingDaily} checks left today)`;
    }

    if (data.remainingMinute !== undefined) {
      msg += ` (${data.remainingMinute} left this minute)`;
    }

    limitInfo.textContent = msg;
    limitInfo.className = "limit-message limit-error";
    limitInfo.style.display = "block";
    return;
  }

  lastResult = data;

  // Show remaining limits in results
  if (data.remainingDaily !== undefined || data.remainingMinute !== undefined) {
    limitInfoResults.textContent =
      `Checks left today: ${data.remainingDaily} • This minute: ${data.remainingMinute}`;

    if (data.remainingDaily <= 1) {
      limitInfoResults.className = "limit-message limit-warning";
    } else {
      limitInfoResults.className = "limit-message limit-ok";
    }

    limitInfoResults.style.display = "block";
  }

  // Main score
  scoreCircle.textContent = data.score;
  gradeEl.textContent = data.grade;

  // Counts
  criticalCount.textContent = data.criticalIssues;
  improveCount.textContent = data.improvements;
  passedCount.textContent = data.passedChecks;

  // Bars
  barGoogle.style.width = data.technicalSEO + "%";
  barLead.style.width = data.localSEO + "%";
  barTrust.style.width = data.trust + "%";
  barMobile.style.width = data.mobile + "%";
  barConversions.style.width = data.conversions + "%";

// Enquiries lost / recommendation
if (data.score >= 90) {
  lostEnquiries.innerHTML = `
    <strong>Excellent work!</strong><br><br>
    Your website is performing strongly and appears well positioned to generate enquiries. The audit found very few areas requiring attention, which is a great result. Continue keeping your content up to date and monitoring performance to maintain these standards.
  `;
} else if (data.score >= 70) {
  lostEnquiries.innerHTML = `
    <strong>Good job.</strong><br><br>
    Your website has a solid foundation. A few improvements could help increase visibility, strengthen user experience and generate more enquiries over time.
  `;
} else if (data.score >= 50) {
  lostEnquiries.innerHTML = `
    <strong>There are some opportunities for improvement.</strong><br><br>
    Several issues may be affecting search visibility, customer trust and lead generation. Many businesses in this position choose to refresh or replace older websites rather than continually patch them.
    <br><br>
    RCTX builds modern, mobile-friendly websites designed around speed, usability and generating enquiries.
    <br><br>
    <a href="/contact.html" class="btn-small">Get a Website Quote</a>
  `;
} else {
  lostEnquiries.innerHTML = `
    <strong>This website could benefit from significant improvements.</strong><br><br>
    Several factors may be limiting search visibility and reducing potential enquiries. While some issues can be addressed individually, many businesses find that a modern rebuild delivers the best long-term results.
    <br><br>
    RCTX creates fast, professional websites for local businesses, focusing on user experience, search visibility and generating enquiries.
    <br><br>
    <a href="/contact.html" class="btn-small">Request a Free Quote</a>
  `;
}
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
