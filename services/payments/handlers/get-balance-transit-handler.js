const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.main = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log("cors test");

  try {
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;

    let params = {
      customerId,
    };
    console.log({params});

    const avaliablebBalance = await dbq.getPaymentsBalanceTransitSum(params)
    let balance = helpers.formatCurrency(avaliablebBalance[0].dataValues.sum);

    return helpers.LambdaHttpResponse2(200, { data: { balance } }, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};