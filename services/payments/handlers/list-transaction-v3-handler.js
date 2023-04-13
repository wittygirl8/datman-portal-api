const Joi = require("@hapi/joi");
const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const { getCustomerDetails } = require("../../stripe/dbq");
const { getTransformedPayment0bject } = require("../payment_helpers/get-transformed-payment")
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
    payload.offset= payload.offset > 0 ? payload.limit*(payload.offset-1) : 0
    const schema = Joi.object({
      from: Joi.date(),
      to: Joi.date(),
      via: Joi.string().valid("DAY", "WEEK", "MONTH","YEAR", "ALL", "RANGE"),
      merchant_type: Joi.string().valid("DATMAN-RESELLER","DATMAN-DELIVERY-PARTNER"),
      offset : Joi.number(),
      page: Joi.number(),
      limit: Joi.number()
    });

    let ok = await schema.validateAsync(payload);

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    let response;
    var payment;
    params = { ...payload, customer_id: customerId };
    console.log({params})

    const datman_partner_types = ["DATMAN-RESELLER","DATMAN-DELIVERY-PARTNER"];
    if(datman_partner_types.includes(payload.merchant_type)){
      console.log("Getting partner transactions")
      payment = await dbq.getPartnerTransactions(params);
    }else{
      console.log("Getting Merchant transactions")
      payment = await dbq.gettransactionListV2(params);
    }
    let transformedPaymentObject;
    //?page=1&limit=10

    const { page, limit } = payload ;

    if(page && limit) {
      console.log('Fetching data using query params for payments v3');
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
  
      const results = {};
      if (endIndex < payment.length) {
        results.next = {
          page: page + 1,
          limit: limit
        };
      }
   
      if (startIndex > 0) {
        results.previous = {
          page: page - 1,
          limit: limit
        };
      }
   
      results.results = payment.slice(startIndex, endIndex);
      transformedPaymentObject = await getTransformedPayment0bject(results.results);
      console.log({transformedPaymentObject});
  
  
      response = {
        data: {
          transactions: transformedPaymentObject.transformedPayment,
          total: parseFloat(transformedPaymentObject.allTotal).toFixed(2),
          count: (transformedPaymentObject.transformedPayment).length
        },
      };
    } else  {
      console.log('Fetching all data at once for payments v3');
      transformedPaymentObject = await getTransformedPayment0bject(payment);

    console.log({transformedPaymentObject});
    response = {
      data: {
        transactions: transformedPaymentObject.transformedPayment,
        total: parseFloat(transformedPaymentObject.allTotal).toFixed(2),
        count: (transformedPaymentObject.transformedPayment).length
      },
    };

    };
    
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};