import { Resvg } from "@resvg/resvg-js";

export async function handler(event) {
  const category = event.queryStringParameters.category || "business";

  const title = `Find Local ${category.replace(/-/g, " ")} in Rhondda Cynon Taf`;

  const svg = `
  <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0b1a33"/>
    <text x="50%" y="40%" fill="#00bfff" font-size="60" font-family="Arial" text-anchor="middle">${title}</text>
    <text x="50%" y="70%" fill="#ffcc00" font-size="40" font-family="Arial" text-anchor="middle">Find Local Services</text>
  </svg>
  `;

  const resvg = new Resvg(svg);
  const pngData = resvg.render().asPng();

  return {
    statusCode: 200,
    headers: { "Content-Type": "image/png" },
    body: pngData.toString("base64"),
    isBase64Encoded: true
  };
}
