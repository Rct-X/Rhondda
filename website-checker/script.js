// Animate fade-ins
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
const checksList = document.getElementById("checksList");
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

  // Show results
  scoreCircle.textContent = data.score;
  gradeEl.textContent = data.grade;

  checksList.innerHTML = "";
  data.checks.forEach(c => {
    const div = document.createElement("div");
    div.className = c.pass ? "check-pass" : "check-fail";
    div.textContent = c.label;
    checksList.appendChild(div);
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
