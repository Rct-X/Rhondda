await fetch("/.netlify/functions/sendSeededListingEmail", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: business.name,
    email: business.email,
    businessName: business.businessName,
    slug: business.slug,
    townSlug: business.townSlug,
    categorySlug: business.categorySlug
  })
});
