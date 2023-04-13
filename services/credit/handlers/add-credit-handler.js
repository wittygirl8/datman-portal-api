
const helpers = require('../../../library/helpers')
const dbq = require('../dbq');
const moment = require('moment-timezone');
const schema = require('../../../library/helpers/schema')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

module.exports.addCredit = async (event) => {

  try {
    
    let payload = JSON.parse(event.body);
    await schema.addCreditSchema.validateAsync(payload);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchant_id = authoriserPayload.merchant_id;

    const isOmniPay = await dbq.getCustomerType({ merchant_id });

    if(isOmniPay[0].customer_type === 'OMNIPAY') {
      throw {message : 'Cannot credit to OmniPay Merchants...!'};
    };

   
    let feeInfo = await dbq.getFeeInfo({ merchant_id })
    feeInfo = feeInfo[0];
    console.log('getFeeInfo', feeInfo);
    const percentage_fee = Number(feeInfo.percentage_fee) / 100;
    const fixed_fee = Number(feeInfo.fixed_fee);
    
    const net = Number(payload.credit_amount);
    let gross = helpers.roundOfInteger((net + fixed_fee) / (1 - (percentage_fee)));
    let fees = helpers.roundOfInteger((gross *  percentage_fee) + fixed_fee);
    

   let params = {
      customer_id: merchant_id,
      ip: event.requestContext.identity.sourceIp,
      firstname: payload.customer_name,
      lastname: `Datman Credit (${payload.credit_reason})`,
      address : payload.address || '',
      total : gross,
      fees : fees,
      payed : net,
      payment_status : 'OK',
      withdraw_status : 1,
      week_no : moment.tz(process.env.DEFAULT_TIMEZONE).format('W'),
      day : moment.tz(process.env.DEFAULT_TIMEZONE).format('D'),
      month : moment.tz(process.env.DEFAULT_TIMEZONE).format('M'),
      year : moment.tz(process.env.DEFAULT_TIMEZONE).format('Y')
    }
    
    const creditInfo = await dbq.pushCredit(params);
    console.log('creditInfo', creditInfo);
    const response = {
      status : 'success',
      message: 'Credited added successfully',
      payment_id: creditInfo.id
    }
    return helpers.LambdaHttpResponse2(200, response, headers)

  }
  catch(e) {
    return helpers.LambdaHttpResponse2(401, { message: e.message }, headers)
  }
}

