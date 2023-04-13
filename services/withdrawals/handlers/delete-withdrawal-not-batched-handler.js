const dbq = require('../dbq');
const helpers = require('../../../library/helpers');
const schema = require('../../../library/helpers/schema');
const moment = require("moment-timezone");
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}


module.exports.deleteNotBatchedWithdrawals = async (event) => {
  try {
    let payload = JSON.parse(event.body);
    await schema.withdrawalsNotBatchedSchema.validateAsync(payload);
    const getPaymentInfo = await dbq.getPaymentMethod(payload.payment_id);

    if (!getPaymentInfo) {
      const message = 'record does not exists';
      return helpers.LambdaHttpResponse2(404, { message }, headers)
    }

    let response, params;

    const date = moment.tz(process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    if(getPaymentInfo.withdraw_status === 1 && getPaymentInfo.delete_status === 0) {
      params = {
        payment_id: payload.payment_id,
        delete_message: `Txn deleted by user ${payload.user_deleted} at ${date}`
      };
      await dbq.updateWithdrawalNotBatched(params);
      response = {
        status: 'success',
        message: 'Record deleted successfully'
      }
    }
    else if(getPaymentInfo.delete_status === 1){
      response = {
        status: 'failed',
        message: `Payment Id: ${payload.payment_id} is already deleted!`
      }
    } else if (getPaymentInfo.withdraw_status === 2) {
      response = {
        status: 'failed',
        message: `Payment Id: ${payload.payment_id} is already batched!`
      }
    }

    return helpers.LambdaHttpResponse2(200, response, headers)

  } catch (e) {
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
}
