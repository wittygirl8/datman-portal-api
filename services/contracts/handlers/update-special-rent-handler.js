const dbq = require('../dbq')
const helpers = require('../../../library/helpers')
const schema = require('../../../library/helpers/schema');
const Joi = require("@hapi/joi");

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.updateSpecialRent = async (event) => {
  try {
    let payload = JSON.parse(event.body)

    await schema.createSpecialRentPayloadSchema.keys({
      rent_id: Joi.number().strict().required(),
    }).validateAsync(payload);

    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchantId = authoriserPayload.merchant_id;
    payload = {
      ...payload,
      merchant_id: merchantId,
    };
    console.log('payload', payload);
    let rentDetails = await dbq.getRentDetails(payload);
    console.log('rentDetails', rentDetails);
    if (!rentDetails.length) {
      let message = `Rent_id doesn't exists`;
      return helpers.LambdaHttpResponse2(404, { message }, headers);
    }

    //   i. Throw error, if the payload start/finish date matches with any of the existing active special rent

    let today = new Date().toISOString().split('T')[0];
    if (payload.start_date < today) {
      throw { message: `Please enter valid start date!` }
    } else if (payload.end_date < payload.start_date) {
      throw { message: `Please enter valid end date!` }
    }

    let availableSpecialRentDate = await dbq.getExistingSpecialRentUpdate(payload);

    if(availableSpecialRentDate.length === 0 || (availableSpecialRentDate.length === 1 && availableSpecialRentDate[0].id === payload.rent_id )){
        await dbq.updateSpecialRent(payload);
    } else {
      throw { message: `This date overlaps with an existing deal!` }
    }

    const response = {
      status: 'success',
      message: 'Special rent Updated successfully'
    }

    return helpers.LambdaHttpResponse2(200, response, headers)

  } catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
