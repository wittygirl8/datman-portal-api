const dbq = require('../dbq')
const helpers = require('../../../library/helpers')
const Joi = require('@hapi/joi');
const { RefundHistoryPayloadSchema } = require("../schema");
const moment = require('moment-timezone');
const TIMEZONE = 'europe/london';

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}


module.exports.refundHistory = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        payload = await RefundHistoryPayloadSchema.validateAsync(payload);

        let customerInfo = await dbq.getCustomers({
          customerId: authoriserPayload.merchant_id
        })

        //1.validating payload

        //2. Check for Transaction using id
        let paymentInfo;
        if (customerInfo.customer_type === 'DATMAN') {
          paymentInfo = await dbq.getPayment({
            where: { id: payload.payment_id }
          })
        } else if (customerInfo.customer_type === 'OMNIPAY') {
          if (!payload.payment_id || !payload.payment_provider || !payload.TxnReference) {
            message = "Required parameters missing"
            return helpers.LambdaHttpResponse2(400, { outcome: 'failed', message }, headers)
          }
          if (payload.payment_provider === 'DNA') {
            paymentInfo = await dbq.getPaymentTransactions({
              where: {
                id: payload.payment_id,
                payment_provider: payload.payment_provider,
                [helpers.transactionReferenceColumn[payload.payment_provider]]: helpers.decryptData(payload.TxnReference)
              }
            })
          }
          else {
            paymentInfo = await dbq.getPayment({
              where: {
                id: payload.payment_id,
                payment_provider: payload.payment_provider,
                [helpers.transactionReferenceColumn[payload.payment_provider]]: helpers.decryptData(payload.TxnReference)
              }
            })
          }
        }
              
        let RefundHistory = await getRefundHistory(paymentInfo[0], customerInfo.customer_type, payload.payment_provider);
        console.log('RefundHistory',RefundHistory);

        let resp = RefundHistory;
        return helpers.LambdaHttpResponse2(200, resp, headers)
    
    }
    catch(e){
        console.log('Catch Error', e)
        return helpers.LambdaHttpResponse2(400, {message: e.message}, headers)
    }
}

let getRefundHistory = async (paymentInfo,customer_type,payment_provider) => {
  
  let refundData;
  if(!paymentInfo){
    throw {message: "Invalid transaction(#T-60001)"}      
  }
  if(paymentInfo.payment_status != 'OK'){ //a valid payment_id would have status 'OK'
    throw {message: "Invalid transaction(#T-60002)"}
  }
  if(paymentInfo.total < 0){ ////a valid payment_id would have total always greater than 0
    throw {message: "Invalid transaction(#T-60003)"}
  }

  if(parseFloat(paymentInfo.total) === 0){
    //old transactions where we used to update the total value to 0.00
    refundData = await GetRefundInfo({
      type: 'OLD',
      customer_type: customer_type,
      payment_provider: payment_provider,
      paymentInfo
    })
  }

  if(parseFloat(paymentInfo.total) > 0){
    //new transactions, total will be positive and there must be some associated negative entries for refund 
    //based on full/partial refund processed, one/multiple negative entries with card_payment will be available
    refundData = await GetRefundInfo({
      type : 'NEW',
      customer_type: customer_type,
      payment_provider: payment_provider,
      paymentInfo
    })
  }
  return refundData
}

let GetRefundInfo = async (params) => {
  console.log('params',params)
  let {type,paymentInfo} = params
  let RefundInfo;

  if (type === 'NEW') {
    if (params.customer_type === 'DATMAN') {
      RefundInfo = await dbq.getPayment({
        attributes: ['id',['total','refund_amount'],['refund','refund_reason'],['time','refund_time']],
        where : {
          CrossReference : paymentInfo.CrossReference,
          total : {
            [dbq.Op.lt] : 0,
          }
        }
      })
    } else if (params.customer_type === 'OMNIPAY') {
      if (params.payment_provider === 'DNA') {
        RefundInfo = await dbq.getPaymentTransactions({
          attributes: ['id',['total','refund_amount'],['refund','refund_reason'],['created_at','refund_time']],
          where : {
            cross_reference : paymentInfo.cross_reference,
            total : {
              [dbq.Op.lt] : 0,
            }
          }
        })
      }
      else {
        RefundInfo = await dbq.getPayment({
          attributes: ['id',['total','refund_amount'],['refund','refund_reason'],['time','refund_time']],
          where : {
            CrossReference : paymentInfo.CrossReference,
            total : {
              [dbq.Op.lt] : 0,
            }
          }
        })
      }
    }
    
    console.log('RefundInfo',RefundInfo)
    RefundInfo = await Promise.all(RefundInfo.map(async (record) => {
      record['refund_reason'] = await ExtractRefundParameters({
        refund_string : record.refund_reason,
        field: 'reason'
      }),
      record['refund_amount'] = Number(record.refund_amount).toFixed(2)
      return {...record}
    }));
    console.log('RefundInfo2',RefundInfo)
    return RefundInfo;
  }

  if(type === 'OLD'){
    RefundInfo = {
      id: null, //sending id as null, as there is no negative entries for these type of transactions
      refund_amount: Number(await ExtractRefundParameters({
        refund_string : paymentInfo.refund,
        field: 'amount'
      })).toFixed(2),
      refund_reason: await ExtractRefundParameters({
        refund_string : paymentInfo.refund,
        field: 'reason'
      }),
      refund_time: paymentInfo.time,
    } 
    //check if refund_request_log has entry
    let RefundRequestQuery = `SELECT refund_amount,date_added from refund_request_log 
                                WHERE card_payment_id = ${paymentInfo.id} limit 1`;
    let RefundRequestData = await dbq.getQueryData(RefundRequestQuery)
    if(RefundRequestData.length){
      RefundRequestData = RefundRequestData[0];
      RefundInfo['refund_amount'] = Number(RefundRequestData.refund_amount).toFixed(2);
      RefundInfo['refund_time'] = RefundRequestData.date_added
    }
    return RefundInfo;
  }

  
}

let ExtractRefundParameters = async (params) => {
  let {refund_string,field} = params
  if(field === 'reason'){
    let search_result = await ExtractReason(refund_string);
    console.log('search_result',search_result)
    if(search_result){
      return search_result
    }
    return refund_string;
  }
  if(field === 'amount'){
    let pattern = /([0-9]*[.])+[0-9]+/g
    let search_result = refund_string.match(pattern);
    if(search_result.length){
      return parseFloat(search_result[0]);
    }
    return 0.00;
  }
}

let ExtractReason = async (refund_string) => {
  let pattern,search_result 
  //pattern 1 - //characters between keywords 'because' and '<hr>'
  pattern= /(?<=because\s*).*?(?=\s*<hr>)/gs; 
  search_result = refund_string.match(pattern);
  if(Array.isArray(search_result) && search_result.length){
    return search_result[0];
  }
  //pattern 2 - //characters after the keyword 'because'
  pattern = /(?<=because\s).*/gs
  search_result = refund_string.match(pattern);
  if(Array.isArray(search_result) && search_result.length){
    return search_result[0];
  }
  //keep add more when we have more realization in the feature with the existing data
  return false
}