const axios = require("axios");
const moment = require("moment-timezone");
const { chargeBackPayloadSchema } = require("../../../library/helpers/schema");
const helpers = require("../../../library/helpers");
const {
  getChargeBack,
  getCustomer, getRiskCheckResponse,
  pushChargeBack, pushPayment,
  getPayment,
} = require("../dbq");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
const CHARGE_BACK_CODE = {
  "Goods or services not received": "30",
  "Transaction not recognised": "75",
  "Duplicate Payment": "34",
  "Defective goods": "13.3",
  "Other": "37",
};
module.exports.createChargeBack = async (event) => {
  try {
    const payload = JSON.parse(event.body);

    await chargeBackPayloadSchema.validateAsync(payload);
    let currentDate = moment().toDate().toISOString().split('T')[0];
    if (!Number.isInteger(payload.transaction_id)) {
      throw { message: "transaction_id should be an integer" };
    }
    const isValid = moment(payload.date).isValid();
    console.log('is Valid Date', isValid, payload.date);
    if (!isValid) {
      throw { message: "Please provide valid date" };
    } else if (payload.date < currentDate) {
      throw { message: "Please provide valid start date" };
    }
    const payloadDate = payload.date.split("-");
    const chargeBackInfo = await getChargeBack({
      payment_id: payload.transaction_id,
    });

    if (chargeBackInfo) {
      const response = {
        status: "failed",
        message: "Chargeback already processed for this Txn!",
      };

      return helpers.LambdaHttpResponse2(409, response, headers);
    }

    let payment = await getPayment({
      id: payload.transaction_id,
    });

    if (!payment) {
      throw { message: "No transaction information" };
    }
    payment = payment.dataValues;

    const isRefund = payment.refund || payment.total.includes("-");

    if(payment.payment_status != 'OK' || isRefund)
    {
      throw { message: "Chargeback can't be processed for this Transaction!"};
    }

    const customerInfo = await getCustomer({
      id: payment.customer_id,
    });

    const first_name = `Charge Back - please contact the customer directly - Phone: ${customerInfo.customers_number}`;


    const riskCheckInfo = await getRiskCheckResponse({
      cardpayment_id: payload.transaction_id,
    });
    if (riskCheckInfo) {
      const chargeBackPayload = {
        transaction_id: riskCheckInfo.risk_check_id,
        chargeback_code: CHARGE_BACK_CODE[payload.reason],
      };
      // if kount transaction id exists
      // do chargeback thing
      // call api
      const { KOUNT_CHARGEBACK_URL } = process.env;
      await axios.post(KOUNT_CHARGEBACK_URL, chargeBackPayload);
    }


    // insert into chargeback
    await pushChargeBack({
      payment_id: payload.transaction_id,
      date: payload.date,
      reason: payload.reason,
      comments: payload.comments,
      outcome: payload.status,
      tel: customerInfo.customers_number,
      customer_id: payment.customer_id,
    });

    const year = payloadDate[0];
    const month = payloadDate[1];
    const day = payloadDate[2];
    // insert into cardpayment
    // below query inserts into card_payment table the same record, with minus value for `total`,`payed` fields, also firstname field value as 'Charge Back'

    delete payment.id; // keeping previous data just removing id to avoid unique constraint violation
    delete payment.day;
    delete payment.month;
    delete payment.year;
    console.log('payment data', payment);
    await pushPayment({
      ...payment,
      firstname: first_name,
      total: `-${Number(payment.total).toFixed(2)}`,
      payed: `-${Number(payment.payed).toFixed(2)}`,
      day: day,
      year: year,
      month: month,
      time: moment().tz(process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
    });
    const response = {
      status: "success",
      message: "New chargeback created successfully!"
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};
