const { getContract } = require("../dbq");
const helpers = require("../../../library/helpers");
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.getContract = async (event) => {
  try {
    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
    let contract = await getContract({merchant_id : authoriserPayload.merchant_id});
        
    if(!contract){
      return helpers.LambdaHttpResponse2(404, { message: 'Contract does not exist' }, headers)
    }
      contract = contract.dataValues;
      const contractRent = contract.contract_rent ? parseFloat(contract.contract_rent ).toFixed(2) : "0.00";
      const setupFee = contract.setup_fee ? parseFloat(contract.setup_fee).toFixed(2) : "0.00";
      const resPayload =  {
        progress_status : contract.progress_status === 2 ? 'Active' : 'Dormant',
        contract_rent: contractRent,
        contract_length:contract.contract_length,
        notice_period: contract.notice_period,
        setup_charged: contract.setup_charged === 'TRUE',
        setup_fee: setupFee,
        extra_comments: contract.extra_comments,
        services_description: contract.services_description,
        contract_length_print_agreement : `${contract.contract_length} months with a 12 months rolling contract thereafter`,
        notice_period_print_agreement : `${contract.notice_period} Days`
      }
     
    const response = {
      data: resPayload
    }
    return helpers.LambdaHttpResponse2(200, response, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
