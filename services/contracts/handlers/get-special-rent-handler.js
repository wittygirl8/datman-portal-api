const dbq = require('../dbq')
const helpers = require('../../../library/helpers')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.getSpecialRent = async (event) => {
  try {
    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchantId = authoriserPayload.merchant_id;
    const params = {
      merchant_id: merchantId
    }
    let specialRent = await dbq.getSpecialRent(params);
    console.log('specialRent', specialRent);
    
    specialRent = specialRent.map(special_rent =>{
      return {
          rent_id: special_rent.id,
          rent_amount: special_rent.rent_amount,
          start_date : special_rent.start_date,
          end_date: special_rent.end_date,
          status : special_rent.status,
          description: special_rent.description,
      }
    })
   
    return helpers.LambdaHttpResponse2(200, specialRent, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
