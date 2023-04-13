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
      merchant_type: Joi.string().valid("DATMAN-RESELLER","DATMAN-DELIVERY-PARTNER")
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
      payment = await dbq.gettransactionListV5(params);
    }

    let transformedPaymentObject = await getTransformedPayment0bject(payment.reverse()); //reversing the array for the sake of getting the refund amount adjusted with service_charge

    console.log({transformedPaymentObject});
    response = {
      data: {
        transactions: transformedPaymentObject.transformedPayment.reverse(),//reversting again so that latest txns are on top
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
  let CrossReferenceWithServiceCharge = {};
  let transformedPayment = payment.map((item) => {

      let total = parseFloat(helpers.formatCurrency(item.total));
      item.original_total = parseFloat(helpers.formatCurrency(item.original_total));
      item.original_fees = parseFloat(helpers.formatCurrency(item.original_fees));
      item.service_charge = parseFloat(helpers.formatCurrency(item.service_charge));
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
        payed = parseFloat(helpers.formatCurrency(
          item.total - item.fees
        ));
        //if there is a service charge, then map it with CrossReference so that Refund entries can read it and adjust the amount
        if(parseFloat(item.service_charge) > 0){
          CrossReferenceWithServiceCharge[item.CrossReference] = item.service_charge;
          //as the refund amount is mentioned with the refund column, adjusting the amount by doing a simple regex
          item.refund = ReplaceRefundAmountFromText(item.refund, total);
        }
      }
      
      if(
        (item.firstname === 'Refund' || item.payment_status == 'REFUND')
          && total < 0
      ){
        if(CrossReferenceWithServiceCharge[item.CrossReference]){
          total = parseFloat(CrossReferenceWithServiceCharge[item.CrossReference]) + parseFloat(total);
          item.fees = parseFloat(CrossReferenceWithServiceCharge[item.CrossReference]) + parseFloat(item.fees);
          item.service_charge = parseFloat(CrossReferenceWithServiceCharge[item.CrossReference]);
          item.refund = ReplaceRefundAmountFromText(item.refund, total);
        }
      }
      // console.log({item})
      // console.log({CrossReferenceWithServiceCharge});
      // console.log({item})
      // console.log({CrossReferenceWithServiceCharge});

      

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

const ReplaceRefundAmountFromText = (text, amount) => {
  const regex = /Refunded ([\s\S]*?) because/g;
  const match = regex.exec(text);
  if (match) {
      return text.replace(match[1], amount);
  }
  return text;
}