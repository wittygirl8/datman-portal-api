const dbq = require('../dbq')
const helpers = require('../../../library/helpers')
const schema = require('../../../library/helpers/schema');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.deleteSpecialRent = async (event) => {
  try {

    let payload = JSON.parse(event.body);
    await schema.deleteSpecialRentPayloadSchema.validateAsync(payload);
    const rentDetails = await dbq.getRentDetails(payload);
    console.log('rentDetails', rentDetails);
    if(!rentDetails.length){
      let message = `Rent_id doesn't exists`;
      return helpers.LambdaHttpResponse2(404, { message }, headers);
    }
    await dbq.deleteSpecialRent(payload);

    const response = {
      status : 'success',
      message: 'Special rent deleted successfully'
    };

    return helpers.LambdaHttpResponse2(200, response, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
