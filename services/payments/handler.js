const Joi = require("@hapi/joi");
const dbq = require("./dbq");
const helpers = require("../../library/helpers");
const DbHelpers = require('../../library/helpers/db-helpers')
const changeCase = require("change-case");
const axios = require("axios");
const moment = require('moment-timezone');
const { getCustomerDetails } = require("../stripe/dbq");
const { getTransformedPayment0bject } = require("./payment_helpers/get-transformed-payment")
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.listTransaction = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  console.log("list of transaction");
  try {
    let payload = JSON.parse(event.body);
    const schema = Joi.object({
      day: Joi.number(),
      month: Joi.number(),
      year: Joi.number(),
      week: Joi.number(),
      // customer_id: Joi.string().required(),
      via: Joi.string().valid("DAY", "WEEK", "MONTH", "ALL"),
    });
    // .with('day', 'month', 'year') // when day is queired
    // .with('week', 'year') // when week is queried
    // .with('month', 'year') // when month is queried
    let ok = await schema.validateAsync(payload);

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    params = { ...payload, customer_id: customerId };
    let payment = await dbq.gettransactionList(params);
    let allTotal = 0;
    let totalNumberOfOrder = 0;
    let fees = 0;
    let averageCardFee = 0;
    let transformedPayment = payment.map((item) => {
      // console.log('without dataValues', item)
      // console.log('with dataValues', item.dataValues)

      let total = helpers.formatCurrency(item.dataValues["total"]);
      let firstname = changeCase.sentenceCase(item.dataValues["firstname"]);
      let lastname = changeCase.sentenceCase(item.dataValues["lastname"]);
      let address = changeCase.sentenceCase(item.dataValues["address"]);
      let time = moment.tz(item.dataValues["time"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      // let payed = helpers.formatCurrency(item.dataValues['payed'])
      let payed = 0;

      allTotal = parseFloat(allTotal) + parseFloat(total);
      if (parseFloat(item.total) > 0) {
        totalNumberOfOrder = parseInt(totalNumberOfOrder) + 1;
        fees = parseFloat(fees) + parseFloat(item.fees);
        payed = helpers.formatCurrency(
          item.dataValues["total"] - item.dataValues["fees"]
        );
      }
      //get 3ds uniquereference
      let TxnReference = helpers.getTxnUniqueReference(item.dataValues);
      //get 3ds status
      let ThreeDsStatus = helpers.getThreeDsStatus(item.dataValues);
      delete item.dataValues["VendorTxCode"]; 
      delete item.dataValues["CrossReference"]; 
      return { ...item.dataValues, total, firstname, lastname, address, payed, time, TxnReference,ThreeDsStatus};
    });
    console.log("transformedPayment", transformedPayment);
    averageCardFee = parseFloat(fees / totalNumberOfOrder).toFixed(2);
    let response = {
      data: {
        transactions: transformedPayment,
        total: parseFloat(allTotal).toFixed(2),
        // fees : parseFloat(fees).toFixed(2),
        // total_no_order: totalNumberOfOrder,
        // average_card_fee: averageCardFee
      },
      //
    };
    console.log("resp", response);
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.listTransactionV3 = async (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  console.log("list of transaction");
  try {
    let payload = JSON.parse(event.body);
    const schema = Joi.object({
      from: Joi.date(),
      to: Joi.date(),
      via: Joi.string().valid("DAY", "WEEK", "MONTH","YEAR", "ALL", "RANGE")
    });

    let ok = await schema.validateAsync(payload);

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    
    params = { ...payload, customer_id: customerId };

    var payment = await dbq.gettransactionListV3(params);

    let allTotal = 0;
    let totalNumberOfOrder = 0;
    let fees = 0;
    let averageCardFee = 0;
    
    let transformedPayment = payment.map((item) => {
      // console.log('without dataValues', item)
      // console.log('with dataValues', item.dataValues)

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
    console.log("transformedPayment", transformedPayment);
    averageCardFee = parseFloat(fees / totalNumberOfOrder).toFixed(2);
    let response = {
      data: {
        transactions: transformedPayment,
        total: parseFloat(allTotal).toFixed(2)
      },
    
    };
    
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.listTransactionV2 = async (event, context, callback) => {
  
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  console.log("list of transaction");
  try {
    let payload = JSON.parse(event.body);
    const schema = Joi.object({
      from: Joi.date(),
      to: Joi.date(),
      via: Joi.string().valid("DAY", "WEEK", "MONTH","YEAR", "ALL", "RANGE"),
      page: Joi.number(),
      limit: Joi.number(),
    });

    let ok = await schema.validateAsync(payload);

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    let customerInfo = await dbq.getCustomerType(customerId);
    
    params = { ...payload, customer_id: customerId, customer_type: customerInfo.customer_type, payment_provider: customerInfo.payment_provider };
    var payment = await dbq.gettransactionListV2(params);

    let transformedPaymentObject;
    //?page=1&limit=10

    const { page, limit } = payload;

    if(page && limit) {
      console.log('Fetching data using query params for Payments v2');
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
      console.log('Fetching all data at once for payments v2');
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

module.exports.accountBalance = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;
  console.log("cors test");

  try {
    let payload = JSON.parse(event.body);
    console.log("paramsss", event);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;

    // return helpers.LambdaHttpResponse2(200, {customerId})
    // // schema for request validation
    // const schema = Joi.object({
    //     customer_id: Joi.number()
    // })
    // // validating the request schmea
    // await schema.validateAsync(payload)
    params = {
      customerId,
    };

    let customerInfo = await dbq.getCustomers({
      customerId: authoriserPayload.merchant_id,
    })

    const paymentProviders = ['CARDSTREAM-CH','STRIPE','CHECKOUT-HF']
    let balance
    if (paymentProviders.includes(customerInfo.payment_provider)) {
      const avaliablebBalance = await dbq.getPaymentsBalanceSum(params)
      balance = helpers.formatCurrency(avaliablebBalance[0].dataValues.sum);
    } else {
      let balance_response = await DbHelpers.checkAccountBalance(params)
      balance = balance_response.balance
    }
    let balanceResponse = await DbHelpers.GetAvailableBalance(params,balance);
    return helpers.LambdaHttpResponse2(200, { data: { ...balanceResponse } }, headers);
    
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.getPdqTransactions = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;

  try {
    let payload = JSON.parse(event.body);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    console.log("authoriserPayload", authoriserPayload);

    /**
     * request validations
     */

    const schema = Joi.object({
      month: Joi.number(),
      year: Joi.number(),
    });
    let ok = await schema.validateAsync(payload);

    // get the pdq transactions
    params = {
      ...payload,
      merchantId: authoriserPayload.merchant_id,
    };
    let transactions = await dbq.getPdqTransactions(params);
    transactions = await Promise.all(transactions.map(async (record) => {
      return {
          ...record.dataValues,
          date_time : moment.tz(record.dataValues["date_time"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
      }
    }))
    const successTransactions = await dbq.getPdqTransactionsCount({
      ...payload,
      transaction_status_id: 1,
      merchantId: authoriserPayload.merchant_id,
    });

    const failedTransactions = await dbq.getPdqTransactionsCount({
      ...payload,
      transaction_status_id: 0,
      merchantId: authoriserPayload.merchant_id,
    });
    
    let response = {
      data: transactions,
      successTransactions: successTransactions,
      failedTransactions: failedTransactions
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED getPdqTransactions", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.invoice = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;

  try {
    let payload = JSON.parse(event.body);
     let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
     let merchantId = authoriserPayload.merchant_id;
    //request validations
    const schema = Joi.object({
      month: Joi.number(),
      year: Joi.number(),
      via: Joi.string(),
      offset : Joi.number(),
      limit : Joi.number()
    });
    let ok = await schema.validateAsync(payload);

    params = {
      ...payload,
      merchantId,
    };
    let invoices = await dbq.getInvoice(params);
    let invoiceCount =  await dbq.getInvoiceCount(params)
    invoices = await Promise.all(invoices.map(async (record) => {
      return {
          ...record.dataValues,
          date_paid : moment.tz(record.dataValues["date_paid"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
      }
    }))
    let response = {
      data: invoices,
      count : invoiceCount
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED invoices", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.chargeBack = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  let params;

  try {
    let payload = JSON.parse(event.body);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let merchantId = authoriserPayload.merchant_id;

    /**
     * request validations
     */

    const schema = Joi.object({
      month: Joi.number(),
      year: Joi.number(),
    });
    let ok = await schema.validateAsync(payload);

    params = {
      ...payload,
      merchantId,
    };
    let chargeBacks = await dbq.chargeBack(params);
    chargeBacks = await Promise.all(chargeBacks[0].map(async (record) => {
      return {
          ...record,
          time : moment.tz(record.time, process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
      }
  }))

    let response = {
      data: chargeBacks,
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED chargeBack", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.listPayouts = async (event, context, callback) => {

  try {
    //console.log("auth", event.requestContext.authorizer.payload);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    
    // let customerId = "63191680"

    //console.log("customerId", customerId);
    const customer_details = await dbq.getStripeAccId(customerId);
    console.log("stripeId>>>", customer_details);
    let list={
      "data":[]
    }
    if(customer_details.stripe_acc_id.trim()){
      var stripeCred = await stripecustomerDetails(customerId)
      const stripe = require("stripe")(stripeCred.STRIPE_SK);
     list = await stripe.payouts.list(
       {limit:100},
       {stripe_account:customer_details.stripe_acc_id.trim() ,
    });
  }
  else {
    return helpers.LambdaHttpResponse2(400, { message: "acct id is missing" }, headers);
  }
    console.log("list ===> ", list.data);
    return helpers.LambdaHttpResponse2(200, list, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.payoutTransactions = async (event, context, callback) => {
  try {
    let payoutId = event.pathParameters.payout; //"po_1H6TS7HtexjZAkUsQT6KZvm3";
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    //console.log("customerId", customerId);
    const customer_details = await dbq.getStripeAccId(customerId);
    //console.log("stripeId", customer_details);

    var stripeCred = await stripecustomerDetails(customerId)
    const stripe = require("stripe")(stripeCred.STRIPE_SK);

    const list = await stripe.balanceTransactions.list(
      {payout: payoutId, limit: 100 },
      {stripe_account: customer_details.stripe_acc_id }
    );
    if (list.has_more) {
      let remainingTransactions = await getMoreTransactions(stripe, payoutId, customer_details.stripe_acc_id, list.data[list.data.length - 1].id);
      list.data = list.data.concat(remainingTransactions);
    }

    //console.log("LIST ===> ", list.data)
    return helpers.LambdaHttpResponse2(200, list, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.runReport = async (event, context, callback) => {
  try {
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;

    let payload = JSON.parse(event.body);
    let startDate = payload.interval_start;
    let endDate = payload.interval_end;
    console.log("start", payload);
    const customer_details = await dbq.getStripeAccId(customerId);

    var stripeCred = await stripecustomerDetails(customerId)
    const stripe = require("stripe")(stripeCred.STRIPE_SK);

    const reportObject = await stripe.reporting.reportTypes.retrieve(
      "connected_account_balance_change_from_activity.itemized.3"
    );
    if (reportObject) {
      console.log(
        "report object==>",
        reportObject.data_available_end,
        reportObject.data_available_start
      );
      startDate =
        reportObject.data_available_start > startDate
          ? reportObject.data_available_start
          : startDate;
    }
    console.log("start date==>", startDate);
    const eventObject = await stripe.reporting.reportRuns.create({
      report_type: "connected_account_balance_change_from_activity.itemized.3",
      parameters: {
        interval_start: startDate,
        interval_end: endDate,
        connected_account: customer_details.stripe_acc_id,
      },
    });

    console.log("list ===> ", eventObject);
    return helpers.LambdaHttpResponse2(200, eventObject, headers);
  } catch (e) {
    //console.log('CRASHED', e)
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.fetchReport = async (event, context, callback) => {
  try {
    
    let id = event.pathParameters.id;

    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let customerId = authoriserPayload.merchant_id;
    
    var stripeCred = await stripecustomerDetails(customerId)
    const stripe = require("stripe")(stripeCred.STRIPE_SK);

    console.log("before poll");
    let eventObject = await poll(checkReportStatus, id, stripe, 30000, 5000);
    if (eventObject.status === "succeeded") {
      //console.log("list ===> ", eventObject);
      eventObject = await fetchReportData(eventObject.result.url, stripeCred.STRIPE_SK);
    }
    //console.log("list ===> ", eventObject);
    return helpers.LambdaHttpResponse2(200, eventObject, headers);
  } catch (e) {
    //console.log('CRASHED', e)
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

let checkReportStatus = async (id, stripe) => {
  const eventObject = await stripe.reporting.reportRuns.retrieve(id);
  return eventObject;
};

let fetchReportData = async (url, stripe_key) => {
  try {
    console.log(url);
    var config = {
      method: "get",
      url: url,
      headers: {
        Authorization: `Bearer ${stripe_key}`,
      },
    };

    const list = await axios(config).then((result) => {
      return result;
    });

    console.log("report data ===> ", list.data);
    return list.data;
  } catch (e) {
    console.log("CRASHED", e);
  }
};

async function poll(fn, id, stripe, timeout, ms) {
  var endTime = Number(new Date()) + (timeout || 300000);
  let result = await fn(id, stripe);
  while (result.status !== "succeeded" && Number(new Date()) < endTime) {
    await wait(ms);
    result = await fn(id, stripe);
    //console.log(result);
  }
  return result;
}

function wait(ms = 1000) {
  return new Promise((resolve) => {
    console.log(`waiting ${ms} ms...`);
    setTimeout(resolve, ms);
  });
}

let stripecustomerDetails = async(customerId) => {
  var data = await dbq.getStripeCredentials(customerId);
  console.log("Customer Data: ", data)
  var key = "datman"
  if(data.stripe_acc_type == 'EAT-APPY'){
    key = "eatappy"
  }
  var stripe_cred ;

  if(process.env.MODE == "prod"){
    console.log('using LIVE DB')
    stripe_cred = JSON.parse(process.env.PROD_STRIPE_CREDENTIALS);
  }
  else if(process.env.MODE == 'dev'){
      console.log('using SNAPSHOT DB ')
      var en = process.env.STAGE_STRIPE_CREDENTIALS
      stripe_cred = JSON.parse(process.env.STAGE_STRIPE_CREDENTIALS);

      console.log(key, "KEY")
      console.log(stripe_cred[key], "EATAPPY OR DATMAN")
  }

  return {
    STRIPE_SK: stripe_cred[key].sk,
    STRIPE_PK: stripe_cred[key].pk,
    STRIPE_WH: stripe_cred[key].wh
};
}

async function getMoreTransactions(stripe, payoutId, stripe_acc_id, starting_after) {
  const list = await stripe.balanceTransactions.list(
    { payout: payoutId, limit: 100, starting_after: starting_after },
    { stripe_account: stripe_acc_id }
  );
  if (list.has_more) {
    console.log("has_more in getMore")

    return list.data.concat(await getMoreTransactions(stripe, payoutId, stripe_acc_id, list.data[list.data.length - 1].id));
  }
  else {
    return list.data;
  }
}