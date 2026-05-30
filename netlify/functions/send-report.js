// netlify/functions/send-report.js

exports.handler = async (event) => {
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

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch (e) {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { url, email, score, grade, checks } = payload;

  if (!url || !email) {
    return json({ error: "url and email are required" }, 400);
  }

  // For now: just log. Later you can:
  // - Save to Firestore
  // - Send yourself an email
  // - Push into a CRM
  console.log("Website report lead:", {
    url,
    email,
    score,
    grade,
    checksCount: Array.isArray(checks) ? checks.length : 0
  });

  // TODO: plug in Firestore or email here when you're ready.

  return json({ ok: true, message: "Report received. You can now handle this server-side however you like." }, 200);
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
