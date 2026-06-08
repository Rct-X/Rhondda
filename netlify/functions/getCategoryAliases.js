const categoryAliases = require("./shared/categoryAliases");

exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(categoryAliases)
  };
};
