exports.handler = async () => {
  const base = "https://rctx.co.uk";
  const project = process.env.RN_FIREBASE_PROJECT_ID;

  const fetchCollection = async (name) => {
    const url = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents/${name}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.documents) return [];

    return data.documents.map(doc => {
      const f = doc.fields;
      return {
        slug: f.slug?.stringValue,
        categorySlug: f.categorySlug?.stringValue,
        townSlug: f.townSlug?.stringValue,
        updatedAt: f.approvedAt?.timestampValue || f.createdAt?.timestampValue
      };
    });
  };

  // Fetch all businesses
  const businesses = await fetchCollection("businesses");

  const urls = [];

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

  staticPages.forEach(path => {
    urls.push({
      loc: `${base}${path}`,
      lastmod: new Date().toISOString()
    });
  });

  // Business pages
  businesses.forEach(b => {
    if (!b.categorySlug || !b.townSlug || !b.slug) return;

    urls.push({
      loc: `${base}/directory/${b.categorySlug}/${b.townSlug}/${b.slug}`,
      lastmod: b.updatedAt || new Date().toISOString()
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
