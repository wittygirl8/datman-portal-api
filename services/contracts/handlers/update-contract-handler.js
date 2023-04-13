
const helpers = require('../../../library/helpers')
const dbq = require('../dbq');
const moment = require('moment-timezone');
const schema = require('../../../library/helpers/schema')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

const PROGRESS_STATUS = {
  'Active'  : 2,
  'Dormant' : 3
}
const DATE_FORMAT = 'YYYY-MM-DD';

module.exports.updateContract = async (event) => {
  try {
    let payload = JSON.parse(event.body);
    await schema.createContractSchema.validateAsync(payload);
    
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
    const merchant_id = authoriserPayload.merchant_id
    
    const date_sent = moment().tz(process.env.DEFAULT_TIMEZONE).format(DATE_FORMAT);
    const date_due = moment().tz(process.env.DEFAULT_TIMEZONE).add(10, "days").calendar(null, { sameElse: DATE_FORMAT });

    let params = {
      progress_status: PROGRESS_STATUS[payload.progress_status],
      progress_date: moment.tz(date_sent, process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
      contract_rent: parseFloat(payload.contract_rent).toFixed(2),
      contract_length: payload.contract_length,
      notice_period: payload.notice_period,
      setup_charged: payload.setup_charged.toString().toUpperCase(),
      setup_fee: parseFloat(payload.setup_fee).toFixed(2),
      merchant_id: merchant_id,
    };
    if (payload.setup_charged && payload.setup_fee) {
      const invoice = await dbq.getInvoice({ merchant_id });
      console.log("invoice is", invoice);
      if (!invoice.length) {
        // insert invoice
        // - insert card_payment
        // - update customers table
        
        params = {
          ...params,
          description: "Setup fee",
          ip: event.requestContext.identity.sourceIp,
          date_due: date_due,
          date_sent: date_sent,
          amount: payload.setup_fee,
          week_id: moment().tz(process.env.DEFAULT_TIMEZONE).format("W"),
          year: moment().tz(process.env.DEFAULT_TIMEZONE).format("YYYY"),
          month: moment().tz(process.env.DEFAULT_TIMEZONE).format("M"),
          setup_fee: parseFloat(payload.setup_fee).toFixed(2),
          extra_comments: payload.extra_comments,
          services_description: payload.services_description,
        }
        await dbq.pushInvoiceAndCardInfo(params);
      }
    }

    if(payload.setup_fee){
      params.setup_fee = payload.setup_fee;
    }
    if(payload.extra_comments){
      params.extra_comments = payload.extra_comments
    }
    if(payload.services_description){
      params.services_description = payload.services_description
    }

    await dbq.updateContract(params);

    const response = {
      status: "success",
      message: "Contract updated successfully"
    };
    return helpers.LambdaHttpResponse2(200, response, headers);

  }
  catch(e) {
    return helpers.LambdaHttpResponse2(401, { message: e.message }, headers)
  }
}

