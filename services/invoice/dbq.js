const Invoice = require("./../../database/model/invoice");
const Payment = require("./../../database/model/payment")
const moment = require("moment-timezone");

module.exports.findInvoiceData = async (payload, merchant_id) => {
    return Invoice.findOne({
      attributes: ["id", "customer_id", "amount", "paid_status", "service_description", "date_paid", "payment_method"],
      where: {
        id: payload.id,
        customer_id: merchant_id
      },
      raw: true
    });
  };
  
  module.exports.addInvoiceData = async (params) => {
    let due_date = moment.tz(params.date, "YYYY-MM-DD","Europe/London").add(10, 'days');
    return Invoice.create({
      customer_id: params.merchant_id,
      date_sent: params.date,
      date_due: due_date.format("YYYY-MM-DD"),
      amount: parseFloat(params.amount),
      paid_status: 0,
      week_id: moment.tz("Europe/London").isoWeek(),
      payment_method: "",
      service_description: params.description
    });
  
  };
  
  module.exports.deleteInvoiceData = async (payload, merchant_id) => {
    return Invoice.destroy({
      where: {
        id: payload.id,
        customer_id: merchant_id
      }
    });
  };
  
  module.exports.updateInvoiceData = async (params) => {
    return Invoice.update(
      {
        paid_status: '1',
        payment_method: 'online'
      },
      {
        where: {
          id: params.id,
          customer_id: params.merchant_id
        }
      }
    );
  
  };
  
  module.exports.addToCardPaymentPostInvoiceStatusVerify = async (params) => {
    return Payment.create({
      customer_id: params.merchant_id,
      firstname: params.invoiceDetails.service_description,
      total: -params.invoiceDetails.amount,
      payed: -params.invoiceDetails.amount,
      withdraw_status: '1',
      payment_status: 'OK',
      year: moment.tz("Europe/London").year(),
      month: moment.tz("Europe/London").month()+1, //as moment use 0 as Jan and 11 as Dec
      day: moment.tz("Europe/London").date()
    });
  };