const dbq = require("../dbq");
const schema = require("../../../library/helpers/schema");
const helpers = require("../../../library/helpers");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
const REFUND_PROCESSED = 'REFUND-PROCESSED';

module.exports.processRefundStatus = async (event) => {

  try {
    let payload = JSON.parse(event.body);
    await schema.refundStatusSchema.validateAsync(payload);
    
    const paymentInfo = await dbq.getPaymentInfo(payload);
    console.log('paymentInfo', paymentInfo);
    
    if(!paymentInfo){
      throw {message: 'Invalid payment id'};
    }
    const refundStatusInfo = await dbq.getRefundStatusInfo(payload);
    if(!refundStatusInfo){
      const processedRefundInfo = await dbq.pushRefundStatus(payload);
      console.log('processedRefundInfo', processedRefundInfo);
      let response = {
        status : 'success',
        message : 'Update refund status successfully',
      };

      return helpers.LambdaHttpResponse2(200, response, headers);
    }
    if(refundStatusInfo.status === REFUND_PROCESSED){
      let response = {
        status : 'success',
        message : 'Refund already processed',
      };
      return helpers.LambdaHttpResponse2(200, response, headers);
    }
  } catch (e) {
    console.log("CRASHED chargeBack", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

