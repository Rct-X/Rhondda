fetch("/.netlify/functions/sendSeededListingEmail", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Purple Shoots Shop",
    email: "shop@purpleshoots.co.uk",
    businessName: "Purple Shoots Shop",
    slug: "purple-shoots-shop",
    townSlug: "pontypridd",
    categorySlug: "shops"
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
