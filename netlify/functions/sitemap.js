exports.handler = async (event, context) => {
  const base = "https://rctx.co.uk";

  // Static pages
  const staticPages = [
    "",
    "/pricing",
    "/about",
    "/directory",
    "/add-business",
    "/contact",
    "/website-checker",
    "/web-design-treorchy",
    "/policy/privacy-policy",
    "/policy/terms"
  ];

  // TODO: Replace these with real dynamic data later
  const categories = [
    "handyman-services",
    "driving-lessons",
    "cleaners",
    "plumbers",
    "gardeners",
    "electricians",
    "hairdressers",
    "builders"
  ];

  const towns = [
    "treorchy",
    "treherbert",
    "tonypandy",
    "penygraig",
    "fernhill"
  ];

  const businesses = [
    // Example only — replace with Firestore later
    { category: "plumbers", town: "treorchy", slug: "rctx-plumbing", updatedAt: Date.now() }
  ];

  const urls = [];

  // Static pages
  staticPages.forEach(path => {
    urls.push({
      loc: `${base}${path}`,
      lastmod: new Date().toISOString()
    });
  });

  // Category pages
  categories.forEach(c => {
    urls.push({
      loc: `${base}/directory/${c}`,
      lastmod: new Date().toISOString()
    });
  });

  // Category + Town pages
  categories.forEach(c => {
    towns.forEach(t => {
      urls.push({
        loc: `${base}/directory/${c}/${t}`,
        lastmod: new Date().toISOString()
      });
    });
  });

  // Business pages
  businesses.forEach(b => {
    urls.push({
      loc: `${base}/directory/${b.category}/${b.town}/${b.slug}`,
      lastmod: new Date(b.updatedAt).toISOString()
    });
  });

  // Build XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>0.80</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/xml" },
    body: xml
  };
};
