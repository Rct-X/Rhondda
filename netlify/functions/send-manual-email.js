exports.handler = async () => {

  const response = await fetch(
    "https://rctx.co.uk/.netlify/functions/sendSeededListingEmail",
    {
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
    }
  );

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };

};
