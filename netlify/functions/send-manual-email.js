exports.handler = async () => {

  const response = await fetch(
    "https://rctx.co.uk/.netlify/functions/sendSeededListingEmail",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Rct Heart Heroes Community Shop",
        email: "Cara@rctheartheroes.org",
        businessName: "Rct Heart Heroes Community Shop",
        slug: "rct-heart-heroes-community-shop",
        townSlug: "tonypandy",
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
