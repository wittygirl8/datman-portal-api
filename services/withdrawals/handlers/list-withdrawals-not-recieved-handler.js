const dbq = require('../dbq');
const helpers = require('../../../library/helpers');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}


module.exports.payoutNotReceived = async (event) => {
  try {
   
    const notReceivedFlaggedBatchInfo = await dbq.getNotReceivedPayouts();
    console.log(notReceivedFlaggedBatchInfo);
    
    const response = {
      data: notReceivedFlaggedBatchInfo
    }
    return helpers.LambdaHttpResponse2(200, response, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
