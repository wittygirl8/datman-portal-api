const helpers = require('../../../library/helpers')
const dbq = require('../dbq');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.getBankError = async (event) => {

  try {
    let bankErrorInfo = await dbq.getBankError();
    console.log('bankErrorInfo', bankErrorInfo)

    bankErrorInfo = bankErrorInfo.map(bank_data =>{
      return {
            merchant_id: bank_data.customer_id,
            business_name:  bank_data.business_name,
            country_name:  bank_data.country_name,
            batch_status:  bank_data.batch_status,
            errors:  bank_data.validation_data
      }
    })
    
    const response = {
     data:bankErrorInfo
    }
    return helpers.LambdaHttpResponse2(200, response, headers)

  }
  catch(e) {
    return helpers.LambdaHttpResponse2(401, { message: e.message }, headers)
  }
}

