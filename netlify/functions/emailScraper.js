const fetch = require("node-fetch");

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Social media patterns
const SOCIAL_PATTERNS = {
  facebook: /facebook\.com\/[A-Za-z0-9._-]+/i,
  instagram: /instagram\.com\/[A-Za-z0-9._-]+/i,
  tiktok: /tiktok\.com\/@[A-Za-z0-9._-]+/i,
  linkedin: /linkedin\.com\/company\/[A-Za-z0-9._-]+/i
};

exports.handler = async (event) => {
  try {
    const { url } = JSON.parse(event.body || "{}");

    if (!url) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing URL" })
      };
    }

    let emails = [];

    // ============================
    // 1. SCRAPE WEBSITE
    // ============================

    const homepage = await safeFetch(url);
    emails.push(...extractEmails(homepage));

    // Try common contact pages
    const contactPaths = ["/contact", "/contact-us", "/about", "/privacy"];
    for (const path of contactPaths) {
      const html = await safeFetch(url + path);
      emails.push(...extractEmails(html));
    }

    // ============================
    // 2. FIND SOCIAL MEDIA LINKS
    // ============================

    const socialLinks = extractSocialLinks(homepage);

    // ============================
    // 3. SCRAPE SOCIAL MEDIA PAGES
    // ============================

    for (const link of socialLinks) {
      const html = await safeFetch(link);
      emails.push(...extractEmails(html));
    }

    emails = [...new Set(emails)];

    if (emails.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          emailFound: false,
          emails: [],
          socialLinks
        })
      };
    }

    // ============================
    // 4. VERIFY FIRST EMAIL
    // ============================

    const email = emails[0];
    const verified = await verifyEmail(email);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        emailFound: true,
        email,
        emailVerified: verified,
        socialLinks
      })
    };

  } catch (err) {
    console.error("emailScraper error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};

// ============================
// HELPERS
// ============================

async function safeFetch(url) {
  try {
    return await fetch(url, { timeout: 5000 }).then(r => r.text());
  } catch {
    return "";
  }
}

function extractEmails(html) {
  return html.match(EMAIL_REGEX) || [];
}

function extractSocialLinks(html) {
  const links = [];

  for (const [platform, regex] of Object.entries(SOCIAL_PATTERNS)) {
    const match = html.match(regex);
    if (match) links.push(match[0]);
  }

  return links;
}

async function verifyEmail(email) {
  const domain = email.split("@")[1];

  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`);
    const json = await res.json();
    return json.Answer && json.Answer.length > 0;
  } catch {
    return false;
  }
}
