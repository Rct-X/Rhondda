// netlify/functions/check-website.js

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: cors(),
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return json({ error: "Use POST" }, 405);
  }

  let url;
  try {
    const body = JSON.parse(event.body || "{}");
    url = (body.url || "").trim();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!url) return json({ error: "URL is required" }, 400);

  // Normalise URL
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  console.log("User entered URL:", url);

  let response;
  let html = "";
  let start = Date.now();

  try {
    response = await fetch(url, { redirect: "follow" });

    // ⭐ Correct placement
    console.log("Final fetched URL:", response.url);

    const buf = await response.arrayBuffer();
    const loadTimeMs = Date.now() - start;
    const sizeBytes = buf.byteLength;
    html = bufferToString(buf);

    const raw = runChecks({
      url,
      html,
      loadTimeMs,
      sizeBytes,
      status: response.status
    });

    const report = buildCustomerReport(raw);

    return json(report, 200);

  } catch (err) {
    console.error(err);
    return json({ error: "Could not fetch that website." }, 500);
  }
};



// ----------------- CUSTOMER REPORT BUILDER -----------------

function buildCustomerReport(raw) {
  const passed = raw.checks.filter(c => c.pass).length;

  const critical = raw.checks.filter(c =>
    !c.pass &&
    ["https", "status_200", "speed", "cta_above_fold", "phone_whatsapp"].includes(c.id)
  );

  const improvements = raw.checks.filter(c => !c.pass && !critical.includes(c));

  const categories = {
    googleVisibility: scoreCategory(raw, ["title", "meta_description", "open_graph", "schema", "local_keywords"]),
    leadGen: scoreCategory(raw, ["cta_above_fold", "phone_whatsapp"]),
    trust: scoreCategory(raw, ["https", "favicon", "schema"]),
    mobile: scoreCategory(raw, ["viewport", "speed"])
  };

  const lost = Math.round((100 - raw.score) / 12);

  const topFixes = [];
  if (!raw.checks.find(c => c.id === "phone_whatsapp").pass) topFixes.push("Add click-to-call");
  if (!raw.checks.find(c => c.id === "cta_above_fold").pass) topFixes.push("Improve homepage CTA");
  if (!raw.checks.find(c => c.id === "schema").pass) topFixes.push("Add customer reviews");
  if (!raw.checks.find(c => c.id === "local_keywords").pass) topFixes.push("Improve local SEO");

  return {
    ok: true,
    url: raw.url,
    score: raw.score,
    grade: raw.grade,

    criticalIssues: critical.length,
    improvements: improvements.length,
    passedChecks: passed,

    googleVisibility: categories.googleVisibility,
    leadGeneration: categories.leadGen,
    trustCredibility: categories.trust,
    mobileExperience: categories.mobile,

    enquiriesLost: lost,
    topFixes,
    checks: raw.checks
  };
}

function scoreCategory(raw, ids) {
  const total = ids.length;
  const passed = ids.filter(id => raw.checks.find(c => c.id === id)?.pass).length;
  return Math.round((passed / total) * 100);
}



// ----------------- CHECK ENGINE (UPDATED REGEX) -----------------

function runChecks({ url, html, loadTimeMs, sizeBytes, status }) {
  const lower = html.toLowerCase();
  const head = lower.split("</head>")[0] || lower.slice(0, 10000);
  const body = lower.split("</head>")[1] || lower;

  const checks = [];

  const has = (pattern) => pattern.test(lower);
  const hasHead = (pattern) => pattern.test(head);

  // SEO
  checks.push(item("title", "Title tag present", /<title[\s\S]*?<\/title>/i.test(html)));

  checks.push(item("meta_description", "Meta description present",
    /<meta[^>]+name\s*=\s*["']?description["']?[^>]*>/i.test(html)
  ));

  checks.push(item("h1", "H1 heading present",
    /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html)
  ));

  checks.push(item("viewport", "Mobile viewport meta present",
    /<meta[^>]+name\s*=\s*["']?viewport["']?[^>]*>/i.test(html)
  ));

  // Technical
  checks.push(item("https", "Site uses HTTPS", url.toLowerCase().startsWith("https://")));
  checks.push(item("status_200", "Page returns 200 OK", status === 200));

  const sizeKb = Math.round(sizeBytes / 1024);
  checks.push(item("size", `Page size under 2MB (${sizeKb}KB)`, sizeKb <= 2000));
  checks.push(item("speed", `Responds in under 3s (${loadTimeMs}ms)`, loadTimeMs <= 3000));

  // Images
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgWithAlt = imgTags.filter(tag => /\balt\s*=/.test(tag.toLowerCase())).length;
  const altRatio = imgTags.length ? imgWithAlt / imgTags.length : 1;

  checks.push(item("alt_text", "Most images have alt text", altRatio >= 0.7));

  // Social / Trust
  checks.push(item("open_graph", "Open Graph tags present",
    /<meta[^>]+property\s*=\s*["']?og:/i.test(head)
  ));

  checks.push(item("favicon", "Favicon defined",
    /rel\s*=\s*["']?(icon|shortcut icon)["']?/i.test(head)
  ));

  checks.push(item("schema", "Schema present", has(/application\/ld\+json/i)));

  // Local SEO
  checks.push(item("local_keywords", "Local area mentioned",
    /(rhondda|treorchy|tonypandy|porth|pontypridd)/i.test(html)
  ));

  // Conversion
  const aboveFold = body.slice(0, 2000);

  checks.push(item("cta_above_fold", "CTA near top of page",
    /(call|book|enquire|contact|message|get started|get my website)/i.test(aboveFold)
  ));

  checks.push(item("phone_whatsapp", "Click-to-call or WhatsApp present",
    /(tel:|wa\.me|whatsapp)/i.test(html)
  ));

  checks.push(item("broken_links", "No obvious 404 text",
    !/404 not found|page not found/i.test(html)
  ));

  // DEBUG LOGGING
  console.log("----- WEBSITE ANALYSIS -----");
  console.log("URL:", url);
  console.log("Status:", status);
  console.log("HTML Length:", html.length);
  console.log("Load Time:", loadTimeMs + "ms");
  console.log("Size:", sizeBytes + " bytes");

  checks.forEach(check => {
    console.log({ check: check.id, pass: check.pass, label: check.label });
  });

  console.log("HEAD SAMPLE:");
  console.log(head.slice(0, 3000));

  console.log("BODY SAMPLE:");
  console.log(body.slice(0, 3000));

  const { score, grade } = scoreFromChecks(checks);

  return { url, score, grade, checks };
}



// ----------------- HELPERS -----------------

function item(id, label, pass) {
  return { id, label, pass };
}

function scoreFromChecks(checks) {
  const total = checks.length;
  const passed = checks.filter(c => c.pass).length;
  const score = Math.round((passed / total) * 100);

  let grade = "C";
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "E";

  return { score, grade };
}

function bufferToString(buf) {
  try {
    return new TextDecoder("utf-8").decode(buf);
  } catch {
    return "";
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, statusCode = 200) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...cors() },
    body: JSON.stringify(data)
  };
}
