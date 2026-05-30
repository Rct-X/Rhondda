// netlify/functions/check-website.js

// Netlify provides fetch in the runtime, no extra deps needed.

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders(),
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
  } catch (e) {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!url) return json({ error: "URL is required" }, 400);

  // Normalise URL
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  let response;
  let html = "";
  let start = Date.now();
  try {
    response = await fetch(url, { redirect: "follow" });
    const buf = await response.arrayBuffer();
    const loadTimeMs = Date.now() - start;
    const sizeBytes = buf.byteLength;
    html = bufferToString(buf, response.headers.get("content-type"));
    const result = runChecks({ url, html, loadTimeMs, sizeBytes, status: response.status });
    return json(result, 200);
  } catch (err) {
    console.error("Fetch error:", err);
    return json({ error: "Could not fetch that URL. It might be offline or blocking requests." }, 500);
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function json(data, statusCode = 200) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders()
    },
    body: JSON.stringify(data)
  };
}

function bufferToString(buf, contentType) {
  try {
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(buf);
  } catch {
    return buf.toString ? buf.toString("utf8") : "";
  }
}

// ----------------- CHECK LOGIC -----------------

function runChecks({ url, html, loadTimeMs, sizeBytes, status }) {
  const lower = html.toLowerCase();
  const head = lower.split("</head>")[0] || lower.slice(0, 8000);
  const body = lower.split("</head>")[1] || lower;

  const checks = [];

  // Helpers
  const has = (pattern) => pattern.test(lower);
  const hasInHead = (pattern) => pattern.test(head);

  // Basic tags
  checks.push(checkItem("title", "Title tag present", /<title>.*?<\/title>/i.test(html)));
  checks.push(checkItem("meta_description", "Meta description present", /<meta[^>]+name=["']description["'][^>]*>/i.test(html)));
  checks.push(checkItem("h1", "H1 heading present", /<h1[^>]*>.*?<\/h1>/i.test(html)));

  // Mobile
  checks.push(checkItem("viewport", "Mobile viewport meta present", /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html)));

  // HTTPS
  const isHttps = url.startsWith("https://");
  checks.push(checkItem("https", "Site uses HTTPS", isHttps));

  // Status
  checks.push(checkItem("status_200", "Page returns 200 OK", status === 200));

  // Page size
  const sizeKb = Math.round(sizeBytes / 1024);
  const sizeOk = sizeKb <= 2000; // under ~2MB
  checks.push(checkItem("size", `Page size under 2MB (${sizeKb}KB)`, sizeOk, { sizeKb }));

  // Load time (rough)
  const loadOk = loadTimeMs <= 3000;
  checks.push(checkItem("speed", `Responds in under 3s (${loadTimeMs}ms)`, loadOk, { loadTimeMs }));

  // Alt attributes
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgWithAlt = imgTags.filter((t) => /alt=/.test(t.toLowerCase())).length;
  const altRatio = imgTags.length ? imgWithAlt / imgTags.length : 1;
  const altOk = altRatio >= 0.7;
  checks.push(
    checkItem(
      "alt_text",
      "Most images have alt text",
      altOk,
      { totalImages: imgTags.length, withAlt: imgWithAlt, ratio: altRatio }
    )
  );

  // Open Graph
  const ogOk = hasInHead(/<meta[^>]+property=["']og:/);
  checks.push(checkItem("open_graph", "Open Graph tags present", ogOk));

  // Favicon
  const favOk = hasInHead(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]*>/);
  checks.push(checkItem("favicon", "Favicon defined", favOk));

  // Schema
  const schemaOk = has(/application\/ld\+json/) || has(/itemtype=["']https?:\/\/schema.org\//);
  checks.push(checkItem("schema", "Schema / structured data present", schemaOk));

  // Local keywords (Rhondda / town)
  const localOk = /(rhondda|treorchy|tonypandy|porth|pontypridd)/i.test(html);
  checks.push(checkItem("local_keywords", "Local area mentioned in content", localOk));

  // CTA above the fold (first ~1500 chars of body)
  const aboveFold = body.slice(0, 1500);
  const ctaOk = /(call|book|enquire|message|whatsapp|get in touch|contact)/i.test(aboveFold);
  checks.push(checkItem("cta_above_fold", "Clear call-to-action near top of page", ctaOk));

  // Phone / WhatsApp
  const telOk = /(tel:|whatsapp\.com|wa\.me)/i.test(html);
  checks.push(checkItem("phone_whatsapp", "Click-to-call or WhatsApp present", telOk));

  // Broken links (basic: look for obvious 404 text)
  const brokenOk = !/404 not found|page not found/i.test(html);
  checks.push(checkItem("broken_links", "No obvious 404 text on page", brokenOk));

  // Grade + score
  const { score, grade } = scoreFromChecks(checks);

  return {
    ok: true,
    url,
    score,
    grade,
    sizeKb,
    loadTimeMs,
    checks
  };
}

function checkItem(id, label, pass, extra = {}) {
  return {
    id,
    label,
    pass: !!pass,
    ...extra
  };
}

function scoreFromChecks(checks) {
  // Simple weighting: each check equal weight
  const total = checks.length;
  const passed = checks.filter((c) => c.pass).length;
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
