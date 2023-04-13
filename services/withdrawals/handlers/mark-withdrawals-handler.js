const dbq = require('../dbq');
const helpers = require('../../../library/helpers')
const schema = require('../../../library/helpers/schema');
const moment = require('moment-timezone');
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}
const STATUS_ENUM = {
  'NOT-RECEIVED': 'NOT-RECEIVED',
  'CANCEL': 'CANCEL',
  'RESEND': 'RESEND',
}

module.exports.markWithdrawalsStatus = async (event) => {
  try {
    let payload = JSON.parse(event.body)

    await schema.markWithdrawalsSchema.validateAsync(payload);
    const batchInfo = await dbq.getBatchById(payload); 
    console.log('batchInfo', batchInfo);
    if(!batchInfo){
      let response = {
        status : 'failed',
        message : 'Record does not exists!'
      };
      return helpers.LambdaHttpResponse2(404, response, headers);
    }
    if([STATUS_ENUM['NOT-RECEIVED'], STATUS_ENUM['RESEND']].includes(payload.status)){
      payload = {
        ...payload,
        current_datetime:  moment.tz(process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
      }
      await dbq.updateBatch(payload);
    }
    if(STATUS_ENUM['CANCEL'] === payload.status){
      await dbq.updateBatch(payload);
    }
    
    const response = {
      status : 'success',
      message: "Payout status updated successfully"
    }

    return helpers.LambdaHttpResponse2(200, response, headers)

  }catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
