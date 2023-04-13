const helpers = require("../../../library/helpers");
const schema = require('../../../library/helpers/schema')
const dbq = require("../dbq");
const Joi = require('@hapi/joi');
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.main = async (event) => {

  try {
    let payload = JSON.parse(event.body)
    console.log('payload',  payload);

    const schema = Joi.object({
      orderId: Joi.number().allow(null, ''),
      transactionId: Joi.number().positive().allow(null, ''),
      fullName: Joi.string().allow(null, ''),
      customer_id: Joi.number().positive().required()
    });

    let params = {
        orderId: payload.orderId,
        transactionId: payload.transactionId,
        fullName: payload.fullName,
        customer_id: payload.customer_id
    };

    let ok = await schema.validateAsync(payload);

    let result, successParam, query;
    if(params.orderId){
      query = `a.order_id =  ${params.orderId} and a.customer_id = ${params.customer_id}`
      result = await dbq.GetDetailsBySearch(query);
      successParam = `Order ID ${params.orderId}`
    }
    else if(params.transactionId){
      query = `a.id = ${params.transactionId} and a.customer_id = ${params.customer_id}`
      result = await dbq.GetDetailsBySearch(query);
      successParam = `Transaction ID ${params.transactionId}`
    }
    else if(params.fullName){
      query = `concat(a.firstname,' ',a.lastname) like'%${params.fullName}%' and a.customer_id = ${params.customer_id}`
      result = await dbq.GetDetailsBySearch(query);
      successParam = `Full Name ${params.fullName}`
    }
    else
      throw { message: "Order Id, Transaction Id or Full Name not found." }

      if(result.length === 0){
        throw { message: 'No result found!'}
      }

    let response = {
        data : result,
        status: 'sucess',
        message: `Successfully fetched the ${successParam}`
    }
    return helpers.LambdaHttpResponse2(200, response, headers);

  } catch (e) {
    console.log("Main Exception", e.message);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};