const categoryAliases = require("/shared/categoryAliases.js");

exports.handler = async () => {

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(categoryAliases)
  };

};
