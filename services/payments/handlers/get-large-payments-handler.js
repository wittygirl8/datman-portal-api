const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const schema = require('../../../library/helpers/schema')
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
let PAGE_NUMBER = 1;
const PAGNIGATION_SIZE = 250;
module.exports.getLargePayments = async (event) => {

  
  try {
      const payload = JSON.parse(event.body);
      console.log('payload', payload);
      await schema.getLargePaymentSchema.validateAsync(payload);
      
      PAGE_NUMBER = payload.pageNumber  || PAGE_NUMBER;
      
      const offset = (PAGE_NUMBER - 1) * PAGNIGATION_SIZE;
      const params = {
        day: payload.day,
        month: payload.month,
        year: payload.year,
        offset: offset,
        pagination_size: PAGNIGATION_SIZE
      }
      let largePayments = await  dbq.getLargePayments(params);
      
     largePayments = largePayments.map(payment =>{
        return {
          merchant_id : payment.customer_id,
          order_id : payment.order_id,
          customer_name : payment.firstname + payment.lastname,
          address : payment.address,
          amount: parseFloat(payment.total).toFixed(2)
        }
      })
    console.log('largePayments',largePayments);
      const response = {
       largePayments,
        currentPage: PAGE_NUMBER,
        has_more: largePayments.length === PAGNIGATION_SIZE
      };
    
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

