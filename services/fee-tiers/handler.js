"use strict";
const dbq = require("./dbq");
const helpers = require("../../library/helpers");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.createFeeTier = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let payload = JSON.parse(event.body);

    const maxFeeTierId = await dbq.maxFeeTierId();
    const id = maxFeeTierId.max_id;

    const createFeeTier = await dbq.createFeeTier(payload, id);

    const response = {
      status: "success",
      message: "FeeTier ID is created successfully",
      data: {
        feeTierId: createFeeTier.dataValues.id,
        feeTierName: createFeeTier.dataValues.name,
      },
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED functionName", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};
