const dbq = require("../dbq");
const { LambdaHttpResponse2 } = require("../../../library/helpers");
const { checkCustomerPhone } = require("../../../library/helpers/schema");

const moment = require("moment-timezone");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.withdrawalStatus = async (event, context, callback) => {
  try {
    context.callbackWaitsForEmptyEventLoop = false;
    let payload = JSON.parse(event.body);
    await checkCustomerPhone.validateAsync(payload);
    const clientInfo = await dbq.checkIfClient({
      phone: payload.From,
    });
    if (!Object.keys(clientInfo).length) {
      return LambdaHttpResponse2(400, { message: "Unauthorized" }, headers);
    }

    let ivr_message = await getIvrMessage({
      customer_id: clientInfo[0].dataValues.id,
    });
    console.log(ivr_message);
    return LambdaHttpResponse2(200, { ivr_message }, headers);
  } catch (e) {
    console.log(e);
    return LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};

let nextWithdrawalDate = () => {
  let d = moment().tz(process.env.DEFAULT_TIMEZONE).day(9).format("MMMM Do"); //'next Tuesday'

  //if current day is sunday or monday with less than 14:00 hours, then tomorrow
  if (
    moment().tz(process.env.DEFAULT_TIMEZONE).day() < 1 ||
    (moment().tz(process.env.DEFAULT_TIMEZONE).day() == 1 &&
      moment().tz(process.env.DEFAULT_TIMEZONE).hour() < 14)
  ) {
    d = moment().tz(process.env.DEFAULT_TIMEZONE).day(2).format("MMMM Do");
  }
  return d;
};

let getIvrMessage = async (params) => {
  let expected_date = nextWithdrawalDate();
  console.log(expected_date);
  let ivrMessage = {
    amount: "0",
  };
  let totalAmount = 0;

  let cardPaymentTotal = await dbq.pendingPayment({
    customer_id: params.customer_id,
  });

  //   total value comes in negative always, hence make it positive by multiplying it with -1
  cardPaymentTotal = -1 * cardPaymentTotal[0].dataValues.total;

  let pendingBatchTotal = await dbq.pendingBatch({
    customer_id: params.customer_id,
  });
  pendingBatchTotal = -1 * pendingBatchTotal[0].dataValues.total;

  totalAmount = cardPaymentTotal + pendingBatchTotal;

  if (totalAmount > 0) {
    /**
     * You      will     receive   your     withdrawal     for      ${totalAmount} pounds
     *  approximately ivrMessage = `   in   your   account   by   5pm Tuesday  `+expected_date;
     */
    ivrMessage = {
      amount: totalAmount,
      date: expected_date,
    };
  }

  return ivrMessage;
};
