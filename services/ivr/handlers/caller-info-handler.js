"use strict";
const dbq = require("./../dbq");
const helpers = require("../../../library/helpers");
const { checkCustomerPhone } = require("../../../library/helpers/schema");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.checkCallerInfo = async (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    let payload = JSON.parse(event.body);
    console.log("_input check payload__", payload)
    await checkCustomerPhone.validateAsync(payload);
    let caller_status = "others";
    const clientInfo = await dbq.checkIfClient({
      phone: payload.From,
    });
    if (Object.keys(clientInfo).length) {
      caller_status = "client";
    }
    return helpers.LambdaHttpResponse2(200, { caller_status }, headers);
  } catch (e) {
    console.log(e);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};
