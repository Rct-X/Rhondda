const categoryAliases = require("./categoryAliases");

exports.handler = async () => {

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(categoryAliases)
  };

};
