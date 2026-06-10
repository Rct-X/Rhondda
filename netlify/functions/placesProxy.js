const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    const query = event.queryStringParameters.query;

    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, error: "Missing query" })
      };
    }

    const apiKey = process.env.GOOGLE_PLACES_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: "Missing API key" })
      };
    }

    // Request phone numbers + all useful fields
    const url =
      "https://maps.googleapis.com/maps/api/place/textsearch/json?" +
      `query=${encodeURIComponent(query)}` +
      `&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    // Log usage in Firestore via Netlify function
    await fetch(`${process.env.URL}/.netlify/functions/logPlacesUsage`, {
      method: "POST"
    }).catch(() => {});

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        data
      })
    };

  } catch (err) {
    console.error("placesProxy error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
