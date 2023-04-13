const helpers = require("../../../library/helpers");
const { chargeBackFetchDetailsSchema } = require("../../../library/helpers/schema");
const { fetchChargeBackDetails } = require("../dbq");
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}
module.exports.fetchChargebackDetails = async (event) => {
  try {
    let payload = JSON.parse(event.body);

    console.log("payload: ", payload);
    payload = await chargeBackFetchDetailsSchema.validateAsync(payload);

    const response = await fetchChargeBackDetails(payload);
    console.log("response: ", response);
    
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.error("CRASHED ~ Exception in fetchChargebackDetails: ", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

