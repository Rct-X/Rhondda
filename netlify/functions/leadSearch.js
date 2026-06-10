const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters.query;

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing query" })
      };
    }

    const url =
      "https://maps.googleapis.com/maps/api/place/textsearch/json" +
      `?query=${encodeURIComponent(query)}` +
      `&key=${process.env.GOOGLE_PLACES_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
