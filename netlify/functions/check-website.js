// netlify/functions/check-website.js

const requests = new Map();

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

  // -----------------------------
  // IP extraction (safe)
  // -----------------------------
  const ip =
    event.headers["client-ip"] ||
    event.headers["x-nf-client-connection-ip"] ||
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    "unknown";

  const now = Date.now();

  // -----------------------------
  // Soft DAILY limit (5/day)
  // -----------------------------
  const dailyKey = `${ip}-daily`;
  const dailyData = requests.get(dailyKey) || { count: 0, start: now };
  const oneDay = 24 * 60 * 60 * 1000;

  if (now - dailyData.start > oneDay) {
    dailyData.count = 0;
    dailyData.start = now;
  }

  dailyData.count++;
  requests.set(dailyKey, dailyData);

  if (dailyData.count > 5) {
    return json({
      error: "You've reached today's limit. Please try again tomorrow."
    }, 429);
  }

  // -----------------------------
  // Per-minute limiter (5/min)
  // -----------------------------
  const windowMs = 60 * 1000;
  const maxRequests = 5;

  const userData = requests.get(ip) || { count: 0, start: now };

  if (now - userData.start > windowMs) {
    userData.count = 0;
    userData.start = now;
  }

  userData.count++;
  requests.set(ip, userData);

  if (userData.count > maxRequests) {
    return json({
      error: "Too many checks. Please wait a minute."
    }, 429);
  }

  // -----------------------------
  // Parse body
  // -----------------------------
  let url;
  try {
    const body = JSON.parse(event.body || "{}");
    url = (body.url || "").trim();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!url) return json({ error: "URL is required" }, 400);

  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  console.log("User entered URL:", url);

  // -----------------------------
  // Fetch website
  // -----------------------------
  let response;
  let html = "";
  let start = Date.now();

  try {
    response = await fetch(url, { redirect: "follow" });

    console.log("Final fetched URL:", response.url);

    const buf = await response.arrayBuffer();
    const loadTimeMs = Date.now() - start;
    const sizeBytes = buf.byteLength;
    html = bufferToString(buf);

    const raw = runChecks({
      url: response.url,
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
    technicalSEO: scoreCategory(raw, ["title", "meta_description", "h1", "schema"]),
    mobile: scoreCategory(raw, ["viewport", "speed"]),
    trust: scoreCategory(raw, ["https", "favicon", "open_graph", "testimonials"]),
    performance: scoreCategory(raw, ["speed", "size"]),
    contentDepth: scoreCategory(raw, ["alt_text", "local_keywords"]),
    localSEO: scoreCategory(raw, ["local_keywords", "schema"]),
    conversions: scoreCategory(raw, ["phone_whatsapp", "contact_form", "cta_above_fold"])
  };

  const overall =
    Math.round(
      (categories.technicalSEO * 0.20) +
      (categories.mobile * 0.15) +
      (categories.trust * 0.15) +
      (categories.performance * 0.15) +
      (categories.contentDepth * 0.10) +
      (categories.localSEO * 0.10) +
      (categories.conversions * 0.15)
    );

  const lost = Math.round((100 - overall) / 10);

  const topFixes = [];
  if (!raw.checks.find(c => c.id === "phone_whatsapp").pass) topFixes.push("Add click-to-call");
  if (!raw.checks.find(c => c.id === "cta_above_fold").pass) topFixes.push("Improve homepage CTA");
  if (!raw.checks.find(c => c.id === "schema").pass) topFixes.push("Add customer reviews");
  if (!raw.checks.find(c => c.id === "local_keywords").pass) topFixes.push("Improve local SEO");

  return {
    ok: true,
    url: raw.url,
    score: overall,
    grade: gradeFromScore(overall),
    technicalSEO: categories.technicalSEO,
    mobile: categories.mobile,
    trust: categories.trust,
    performance: categories.performance,
    contentDepth: categories.contentDepth,
    localSEO: categories.localSEO,
    conversions: categories.conversions,
    criticalIssues: critical.length,
    improvements: improvements.length,
    passedChecks: passed,
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

function gradeFromScore(score) {
  if (score >= 97) return "A+";
  if (score >= 92) return "A";
  if (score >= 85) return "B";
  if (score >= 70) return "C";
  if (score >= 55) return "D";
  return "E";
}



// ----------------- CHECK ENGINE -----------------

function runChecks({ url, html, loadTimeMs, sizeBytes, status }) {
  const lower = html.toLowerCase();
  const head = lower.split("</head>")[0] || lower.slice(0, 10000);
  const body = lower.split("</head>")[1] || lower;

  const checks = [];

  const has = (pattern) => pattern.test(lower);

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

  checks.push(item("https", "Site uses HTTPS", url.toLowerCase().startsWith("https://")));
  checks.push(item("status_200", "Page returns 200 OK", status === 200));

  const sizeKb = Math.round(sizeBytes / 1024);
  checks.push(item("size", `Page size under 2MB (${sizeKb}KB)`, sizeKb <= 2000));
  checks.push(item("speed", `Responds in under 3s (${loadTimeMs}ms)`, loadTimeMs <= 3000));

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgWithAlt = imgTags.filter(tag => /\balt\s*=/.test(tag.toLowerCase())).length;
  const altRatio = imgTags.length ? imgWithAlt / imgTags.length : 1;

  checks.push(item("alt_text", "Most images have alt text", altRatio >= 0.7));

  checks.push(item("open_graph", "Open Graph tags present",
    /<meta[^>]+property\s*=\s*["']?og:/i.test(head)
  ));

  checks.push(item("favicon", "Favicon defined",
    /rel\s*=\s*["']?(icon|shortcut icon)["']?/i.test(head)
  ));

  checks.push(item("schema", "Schema present", has(/application\/ld\+json/i)));

  checks.push(item("local_keywords", "Local area mentioned",
    /(rhondda|treorchy|tonypandy|porth|pontypridd)/i.test(html)
  ));

  const aboveFold = body.slice(0, 2000);

  checks.push(item("cta_above_fold", "CTA near top of page",
    /(call|book|enquire|contact|message|get started|get my website)/i.test(aboveFold)
  ));

  checks.push(item("phone_whatsapp", "Click-to-call or WhatsApp present",
    /(tel:|wa\.me|whatsapp)/i.test(html)
  ));

  checks.push(item("contact_form", "Contact form present",
    /<form[\s>]/i.test(html)
  ));

  checks.push(item("testimonials", "Testimonials or reviews present",
    /(testimonial|testimonials|review|reviews|customer feedback|what our customers say)/i.test(html)
  ));

  checks.push(item("social_media", "Social media links present",
    /(facebook\.com|instagram\.com|linkedin\.com|tiktok\.com|youtube\.com)/i.test(html)
  ));

  checks.push(item("broken_links", "No obvious 404 text",
    !/404 not found|page not found/i.test(html)
  ));

  return { url, checks };
}



// ----------------- HELPERS -----------------

function item(id, label, pass) {
  return { id, label, pass };
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
