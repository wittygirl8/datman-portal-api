const Joi = require("@hapi/joi");
const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const changeCase = require("change-case");
const axios = require("axios");
const moment = require('moment-timezone');
const { getCustomerDetails } = require("../../stripe/dbq");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};


module.exports.main = async (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  console.log("list of transaction");
  try {
    let payload = JSON.parse(event.body);
    const schema = Joi.object({
      from: Joi.date(),
      to: Joi.date(),
      via: Joi.string().valid("DAY", "WEEK", "MONTH","YEAR", "ALL", "RANGE"),
      merchant_type: Joi.string().valid("DATMAN-RESELLER","DATMAN-DELIVERY-PARTNER"),
      offset: Joi.number(),
      limit: Joi.number(),
      status: Joi.string().valid("OK", "REFUND", "ALL")
    });

    let ok = await schema.validateAsync(payload);

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    let response;
    var payment;
    params = { ...payload, customer_id: customerId };
    console.log({params})

    const datman_partner_types = ["DATMAN-RESELLER","DATMAN-DELIVERY-PARTNERS"];
    if(datman_partner_types.includes(payload.merchant_type)){
      console.log("Getting partner transactions")
      payment = await dbq.getPartnerTransactions(params);
    }else{
      console.log("Getting Merchant transactions")
      payment = await dbq.gettransactionListV4(params);
    }

    let transformedPaymentObject = await getTransformedPayment0bject(payment);

    console.log({transformedPaymentObject});
    response = {
      data: {
        transactions: transformedPaymentObject.transformedPayment,
        total: parseFloat(transformedPaymentObject.allTotal).toFixed(2)
      },
    };
    
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

let getTransformedPayment0bject = async (payment) => {

  let allTotal = 0;
  let totalNumberOfOrder = 0;
  let fees = 0;
  
  let transformedPayment = payment.map((item) => {

      let total = helpers.formatCurrency(item.total);
      let firstname = changeCase.sentenceCase(item.firstname);
      let lastname = changeCase.sentenceCase(item.lastname);
      let address = changeCase.sentenceCase(item.address);
      let time = moment.tz(item.time, process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      // let payed = helpers.formatCurrency(item.dataValues['payed'])
      let payed = 0;

      allTotal = parseFloat(allTotal) + parseFloat(total);
      if (parseFloat(item.total) > 0) {
        totalNumberOfOrder = parseInt(totalNumberOfOrder) + 1;
        fees = parseFloat(fees) + parseFloat(item.fees);
        payed = helpers.formatCurrency(
          item.total - item.fees
        );
      }
      //get 3ds uniquereference
      let TxnReference = helpers.getTxnUniqueReference(item);
      //get 3ds status
      let ThreeDsStatus = helpers.getThreeDsStatus(item);
      delete item.VendorTxCode; 
      delete item.CrossReference; 
      return { ...item, total, firstname, lastname, address, payed, time, TxnReference,ThreeDsStatus};
  });
  return {
      transformedPayment, allTotal
  }

}