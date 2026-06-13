exports.handler = async () => {

  const response = await fetch(
    "https://rctx.co.uk/.netlify/functions/sendSeededListingEmail",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "Gems Fades Barber Shop",
        email: "gemsfades@gmail.com",
        businessName: "Gems Fades Barber Shop",
        slug: "gems-fades-barber-shop",
        townSlug: "ystrad",
        categorySlug: "barbers"
      })
    }
  );

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };

};
