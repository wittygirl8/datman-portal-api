const dbq = require('../dbq')
const helpers = require('../../../library/helpers')
const schema = require('../../../library/helpers/schema');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.createSpecialRent = async (event) => {
  try {
    let payload = JSON.parse(event.body)
    
    await schema.createSpecialRentPayloadSchema.validateAsync(payload);
    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchantId = authoriserPayload.merchant_id;
    
    let params = {
      merchant_id: merchantId
    }
    //a. Validate MID
    let contractRentInfo = await dbq.checkContractRent(params)
    console.log('contractRentInfo', contractRentInfo);
    // i. Throw error if MID doesnt exists in customer table
    if(!contractRentInfo){
      throw {message:`Merchant doesn't exist`};
    }
    contractRentInfo = contractRentInfo.dataValues;
    // ii. Throw error if contract_rent is null/zero
    if(
      !contractRentInfo.contract_rent ||
      contractRentInfo.contract_rent === 0 ||
      contractRentInfo.contract_rent === '0' ||
      contractRentInfo.contract_rent === ''
    ){
      throw {message: `Special rent cannot be added if contract rent updated as zero/empty!`}
    }
    // b. Get existing special rent if any
    let specialRentDate = await dbq.getExistingSpecialRentDate(params);
    console.log('specialRentDate', specialRentDate);
    //   i. Throw error, if the payload start/finish date matches with any of the existing active special rent
    const isDatesOverlapping = helpers.isDatesOverlapping(specialRentDate,payload);
    if(isDatesOverlapping){
      throw {message: `This date overlaps with an existing deal!`}
    }
    
    // c. If all good, insert record into customer_special_rent table
    
     params = {
      ...payload,
       user_added: 'Admin', //authoriserPayload.scopes || 'Agent',
       customer_id: merchantId
    }
    const specialRent = await dbq.createSpecialRent(params);
     console.log('specialRent', specialRent);
    if(!specialRent){
      throw {message:'Failed to create special rent. Try again!'};
    }


    let response = {
      status: 'success',
      message: 'Special rent created successfully',
      rent_id: specialRent.id
    }
    return helpers.LambdaHttpResponse2(200, response, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
