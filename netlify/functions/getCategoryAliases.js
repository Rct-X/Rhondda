const categoryAliases = require("./categoryAliases");

function slugify(str = "") {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

exports.handler = async () => {

  const categories = Object.keys(categoryAliases).map(name => ({
    name,
    slug: slugify(name)
  }));

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ok: true,
      categories
    })
  };

};
