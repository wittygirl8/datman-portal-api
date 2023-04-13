const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const moment = require('moment-timezone');
const Joi = require('@hapi/joi');
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
module.exports.getDnaTransactions = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  try {
    let payload = JSON.parse(event.body);
    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);

    console.log("authoriser Payload", authoriserPayload);

    const schema = Joi.object({
      month: Joi.number(),
      year: Joi.number(),
    });
    let ok = await schema.validateAsync(payload);
    // get the dna transactions
    params = {
      ...payload,
      merchantId: authoriserPayload.merchant_id,
    };

    let getDnaTransactions = await dbq.getDnaTransactionsMonth({
      ...payload,
      merchantId: authoriserPayload.merchant_id
    });

    getDnaTransactions = JSON.parse(JSON.stringify(getDnaTransactions));

    let responseObj;
    let filterTransaction;
    let response= [];

    for (i = 0; i < getDnaTransactions.length; i++) {

      filterTransaction = await dbq.getDnaFilteredTransactions(params, getDnaTransactions[i].settlement_date, getDnaTransactions[i].status);

      responseObj = {
        data: filterTransaction,
        total: parseFloat(getDnaTransactions[i].total).toFixed(2),
        status: getDnaTransactions[i].status,
        count: getDnaTransactions[i].count,
        settlement_date: getDnaTransactions[i].settlement_date,
        provider: 'DNA'
      }
      response.push(responseObj)
    };

    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED getDnaTransactions", e);

    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};