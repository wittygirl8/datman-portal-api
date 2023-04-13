const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const Joi = require("@hapi/joi");
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
};

module.exports.getMonthlyPaymentsHandler = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    try {
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
        let customerId = authoriserPayload.merchant_id;

        let params = {
            customerId
        };

        let monthlyTransaction = await dbq.GetPaymentMonthlyTransaction(params);

        let response = {
            data: {
                allTransactions: monthlyTransaction,
                count: monthlyTransaction.length
            }
        };

        return helpers.LambdaHttpResponse2(200, response, headers);

    } catch (error) {
        console.log('error', error);
        return helpers.LambdaHttpResponse2(400, { message: error.message }, headers);
    }
}