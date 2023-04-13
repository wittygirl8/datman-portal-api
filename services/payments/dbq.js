// imports npm libs
const moment = require("moment-timezone");
const lodash = require('lodash');
// custom imports
const { Sequelize, sequelizeInstance } = require("../../database");

// imports database models
const payment = require("../../database/model/payment");
const payments = require("../../database/model/payments")
const payment_transaction = require("../../database/model/payment_transaction")
const internalTransferTransaction = require("../../database/model/internal_transfer_transaction");
const PdqTransactions = require("../../database/model/pdq_transactions");
const Invoice = require("../../database/model/invoice");
const Customers = require("../../database/model/customers");
const DnaSettlements = require("../../database/model/dna_settlements");

const Op = Sequelize.Op;

module.exports.gettransactionList = (params) => {
  let wq;
  if (params.via == "DAY") {
    wq = {
      customer_id: params.customer_id,
      day: params.day,
      month: params.month,
      year: params.year,
    };
  } else if (params.via == "WEEK") {
    wq = {
      customer_id: params.customer_id,
      week_no: params.week,
      year: params.year,
    };
  } else if (params.via == "MONTH") {
    wq = {
      customer_id: params.customer_id,
      month: params.month,
      year: params.year,
    };
  } else {
    wq = {
      customer_id: params.customer_id,
    };
  }

  console.log("where query", wq);
  return payment.findAll({
    where: { ...wq, payment_status: "OK" },
    order: [["time", "DESC"]],
    attributes: [
      "id",
      "customer_id",
      "order_id",
      "firstname",
      "lastname",
      "address",
      "total",
      "fees",
      "payed",
      "day",
      "month",
      "year",
      "provider",
      "time",
      "refund",
      "last_4_digits",
      "origin",
      "VendorTxCode",
      "CrossReference",
      "payment_provider"
    ],
    indexHints: [{ type: "FORCE", values: ["customer_id"] }],
  });
};

module.exports.gettransactionListV3 = async (params) => {

  let query_string = '';
  let from = new Date(params.from);
  let to = new Date(params.to);

  let query_string_trans = '';

  if (params.via == "DAY") {
    
    query_string = ` day = '${from.getDate()}' and month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
  } else   if (params.via == "WEEK") {

    Date.prototype.getWeek = function() {
      var dt = new Date(this.getFullYear(),0,1);
      return Math.ceil((((this - dt) / 86400000) + dt.getDate()+1)/7);
    };
    
    let week = from.getWeek();
    console.log("WeekNumber", week);
    query_string = ` week_no = '${week}' and year = '${from.getFullYear()}' and`;

    function getDateByWeek(week, year) {
      var d = new Date(year, 0);
      var dayNum = d.getDay();
      var requiredDate = --week * 7;
      if (dayNum != 0 || dayNum > 4) {
        requiredDate += 7;
      }
      d.setDate(1 - d.getDay() + ++requiredDate);
      return d;
    }

    let date = getDateByWeek(week,from.getFullYear()).toISOString().slice(0, 10);
    console.log(date);
    query_string_trans = `a.created_at between '${date}' and '${date}' + interval 1 week  and`;
  }  else if (params.via == "MONTH") {
    query_string = ` month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    let date = `${from.getFullYear()}-${from.getMonth()+1}-01`;  
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 month and`;
  } else if (params.via == "YEAR") {
    query_string = ` year = '${from.getFullYear()}'and`;
    let date = `${from.getFullYear()}-01-01`;
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
  } else if (params.via == "RANGE") {
    query_string = `time between '${params.from}' and '${params.to}' and year between '${from.getFullYear()}' and '${to.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.to}' and`;
  }

  let cardpayment_data = await sequelizeInstance.query(
    `SELECT id, customer_id, order_id, firstname, lastname, address, total, fees, payed,  provider, time, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider FROM card_payment AS card_payment FORCE INDEX (customer_id) WHERE ${query_string} card_payment.customer_id = ${params.customer_id} AND card_payment.payment_status = 'OK'`
  ,{raw: true, type: sequelizeInstance.QueryTypes.SELECT});
  

  let transactions =   await sequelizeInstance.query(
      `select a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total, a.fees, a.payed, a.provider, a.created_at time, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status = 'OK'`
    ,{raw: true, type: sequelizeInstance.QueryTypes.SELECT})

  cardpayment_data.push(...transactions);
  cardpayment_data = lodash.orderBy(cardpayment_data, ['time'], ['desc']);
  
  return  cardpayment_data;

};

module.exports.getPartnerTransactions = async (params) => {

  let from = new Date(params.from);
  let to = new Date(params.to);
  let start = params.offset, end = parseInt(params.offset) + parseInt(params.limit);
  let payment_query_string = '';

  if (params.via == "DAY") {
    
    payment_query_string = `p.transaction_time between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
  
  } else   if (params.via == "WEEK") {

    Date.prototype.getWeek = function() {
      var dt = new Date(this.getFullYear(),0,1);
      return Math.ceil((((this - dt) / 86400000) + dt.getDate()+1)/7);
    };
    
    let week = from.getWeek();
    console.log("WeekNumber", week);
    query_string = ` week_no = '${week}' and year = '${from.getFullYear()}' and`;

    function getDateByWeek(week, year) {
      var d = new Date(year, 0);
      var dayNum = d.getDay();
      var requiredDate = --week * 7;
      if (dayNum != 0 || dayNum > 4) {
        requiredDate += 7;
      }
      d.setDate(1 - d.getDay() + ++requiredDate);
      return d;
    }

    let date = getDateByWeek(week,from.getFullYear()).toISOString().slice(0, 10);
    payment_query_string = `p.transaction_time between '${date}' and '${date}' + interval 1 week  and`;
  }  else if (params.via == "MONTH") {
    
    let date = `${from.getFullYear()}-${from.getMonth()+1}-01`;  
    payment_query_string = `p.transaction_time between '${date}' and '${date}' + INTERVAL 1 month and`;
  } else if (params.via == "YEAR") {
    let date = `${from.getFullYear()}-01-01`;
    payment_query_string = `p.transaction_time between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
  } else if (params.via == "RANGE") {
    payment_query_string = `p.transaction_time between '${params.from}' and '${params.to}' and`;
  }

  

  let paymentsTransactions = await sequelizeInstance.query(`
            SELECT p.id,p.merchant_id customer_id,c.id merchant_id,c.business_name merchant_name,p.order_ref order_id,firstname,lastname,address,round(gross/100,2) total,round(fee/100,2) fees,round(net/100,2) payed,pp.provider_name provider,transaction_time time,'' refund,last_4_digits,transaction_method_id origin,psp_reference VendorTxCode,internal_reference CrossReference,pp.provider_name payment_provider,'' description   
            FROM payments p 
            JOIN payment_providers pp ON p.payment_provider_id = pp.id 
            JOIN payments_split_commission psc ON p.id = psc.partner_payments_id 
            JOIN customers c ON psc.merchant_id = c.id 
            WHERE 
              ${payment_query_string}  
              p.merchant_id = ${params.customer_id}  
              AND p.transaction_status_id in (1,3,4,5,6)`,
  {raw: true, type: sequelizeInstance.QueryTypes.SELECT});
  
  paymentsTransactions = lodash.orderBy(paymentsTransactions, ['time'], ['desc']);

  paymentsTransactions = paymentsTransactions.slice(start, end)
  return  paymentsTransactions;

};

module.exports.gettransactionListV2 = async (params) => {

  let query_string = '';
  let from = new Date(params.from);
  let to = new Date(params.to);
  let start = params.offset, end = parseInt(params.offset) + parseInt(params.limit);
  let query_string_trans = '';
  let payment_query_string = '';

  if (params.via == "DAY") {
    
    query_string = ` day = '${from.getDate()}' and month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
  } else   if (params.via == "WEEK") {

    Date.prototype.getWeek = function() {
      var dt = new Date(this.getFullYear(),0,1);
      return Math.ceil((((this - dt) / 86400000) + dt.getDate()+1)/7);
    };
    
    let week = from.getWeek();
    console.log("WeekNumber", week);
    query_string = ` week_no = '${week}' and year = '${from.getFullYear()}' and`;

    function getDateByWeek(week, year) {
      var d = new Date(year, 0);
      var dayNum = d.getDay();
      var requiredDate = --week * 7;
      if (dayNum != 0 || dayNum > 4) {
        requiredDate += 7;
      }
      d.setDate(1 - d.getDay() + ++requiredDate);
      return d;
    }

    let date = getDateByWeek(week,from.getFullYear()).toISOString().slice(0, 10);
    console.log(date);
    query_string_trans = `a.created_at between '${date}' and '${date}' + interval 1 week  and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + interval 1 week  and`;
  }  else if (params.via == "MONTH") {
    query_string = ` month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    let date = `${from.getFullYear()}-${from.getMonth()+1}-01`;  
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 month and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 month and`;
  } else if (params.via == "YEAR") {
    query_string = ` year = '${from.getFullYear()}'and`;
    let date = `${from.getFullYear()}-01-01`;
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
  } else if (params.via == "RANGE") {
    query_string = `time between '${params.from}' and '${params.to}' and year between '${from.getFullYear()}' and '${to.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.to}' and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.to}' and`;
  }

  let transactionsQuery;
  if (params.customer_type === "OMNIPAY" && params.payment_provider === 'DNA') {
    transactionsQuery = `select a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total, a.fees, a.payed, a.provider, a.created_at time, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status not in ('UNTRIED', 'INBATCH')`;
  } else {
    transactionsQuery = `select a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total, a.fees, a.payed, a.provider, a.created_at time, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status = 'OK'`;
  }

  let cardpayment_data = await sequelizeInstance.query(
    `SELECT id, customer_id, order_id, firstname, lastname, address, total, fees, payed,  provider, time, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider, ifnull(more_info,'') more_info FROM card_payment AS card_payment FORCE INDEX (customer_id) WHERE ${query_string} card_payment.customer_id = ${params.customer_id} AND card_payment.payment_status = 'OK'`
    , { raw: true, type: sequelizeInstance.QueryTypes.SELECT });

  let transactions = await sequelizeInstance.query(transactionsQuery, { raw: true, type: sequelizeInstance.QueryTypes.SELECT })

  let paymentsTransactions = await sequelizeInstance.query(
      `select a.id, merchant_id customer_id, order_ref order_id, firstname, lastname, address, gross/100 total, fee/100 fees, net/100 payed, b.provider_name provider, transaction_time time, (case when  (transaction_status_id = 1 and refund_reason_id is null) then ''  else reason end) refund, last_4_digits, transaction_method_id origin, psp_reference VendorTxCode, internal_reference CrossReference, b.provider_name payment_provider, '' description, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status from payments a, payment_providers b where ${payment_query_string} a.payment_provider_id = b.id and merchant_id = ${params.customer_id} and transaction_status_id in (1,2,3,4,5,6)`,
      { raw: true, type: sequelizeInstance.QueryTypes.SELECT }
  );
  cardpayment_data.push(...transactions);
  cardpayment_data.push(...paymentsTransactions);
  cardpayment_data = lodash.orderBy(cardpayment_data, ['time'], ['desc']);
  
  cardpayment_data = cardpayment_data.slice(start, end)
  return  cardpayment_data;
};

module.exports.gettransactionListV4 = async (params) => {
  let query_string = "";
  let from = new Date(params.from);
  let to = new Date(params.to);
  let offset = params.offset;
  let limit = params.limit;
  let pagination = `limit ${limit} offset ${offset}`;

  let query_string_trans = "";
  let payment_query_string = "";

  if (params.via == "DAY") {
    query_string = ` day = '${from.getDate()}' and month = '${
      from.getMonth() + 1
    }' and year = '${from.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
  } else if (params.via == "WEEK") {
    Date.prototype.getWeek = function () {
      var dt = new Date(this.getFullYear(), 0, 1);
      return Math.ceil(((this - dt) / 86400000 + dt.getDate() + 1) / 7);
    };

    let week = from.getWeek();
    console.log("WeekNumber", week);
    query_string = ` week_no = '${week}' and year = '${from.getFullYear()}' and`;

    function getDateByWeek(week, year) {
      var d = new Date(year, 0);
      var dayNum = d.getDay();
      var requiredDate = --week * 7;
      if (dayNum != 0 || dayNum > 4) {
        requiredDate += 7;
      }
      d.setDate(1 - d.getDay() + ++requiredDate);
      return d;
    }

    let date = getDateByWeek(week, from.getFullYear())
      .toISOString()
      .slice(0, 10);
    console.log(date);
    query_string_trans = `a.created_at between '${date}' and '${date}' + interval 1 week  and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + interval 1 week  and`;
  } else if (params.via == "MONTH") {
    query_string = ` month = '${
      from.getMonth() + 1
    }' and year = '${from.getFullYear()}' and`;
    let date = `${from.getFullYear()}-${from.getMonth() + 1}-01`;
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 month and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 month and`;
  } else if (params.via == "YEAR") {
    query_string = ` year = '${from.getFullYear()}'and`;
    let date = `${from.getFullYear()}-01-01`;
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
  } else if (params.via == "RANGE") {
    query_string = `time between '${params.from}' and '${
      params.to
    }' and year between '${from.getFullYear()}' and '${to.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.to}' and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.to}' and`;
  }

  let transactionsQuery;
  let cardpayment_data_query;
  let paymentTransaction_data_query;
  let finalQuery;
  let deductCardPaymentFeeQuery = `(select round(x.amount/100,2)  from payments_split_commission x where x.payment_status = 1 and x.commission_type_id = 6 and x.transaction_table = 'card_payment' and x.merchant_payments_id = card_payment.id union all select 0 limit 1)`;
  let deductPaymentsFeeQuery = `(select round(x.amount/100,2)  from payments_split_commission x where x.payment_status = 1 and x.commission_type_id = 6 and x.transaction_table = 'payments' and x.merchant_payments_id = a.id union all select 0 limit 1)`;
  let deductPaymentTransactionFeeQuery = `(select round(x.amount/100,2)  from payments_split_commission x where x.payment_status = 1 and x.commission_type_id = 6 and x.transaction_table = 'payment_transaction' and x.merchant_payments_id = a.id union all select 0 limit 1)`;

  if (params.status == "OK") {
    if (
      params.customer_type === "OMNIPAY" &&
      params.payment_provider === "DNA"
    ) {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and refund is null and a.merchant_id = ${params.customer_id} and payment_status not in ('UNTRIED', 'INBATCH') order by a.created_at desc ${pagination}`;
    } else {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees  - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status = 'OK' and refund is null order by a.created_at desc ${pagination}`;
    }
    cardpayment_data_query = `SELECT time, id, customer_id, order_id, firstname, lastname, address, total - ${deductCardPaymentFeeQuery} total, fees - ${deductCardPaymentFeeQuery} fees, payed,  provider, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider,'' description, '' more_info, card_payment.payment_status FROM card_payment AS card_payment FORCE INDEX (customer_id) WHERE ${query_string} card_payment.customer_id = ${params.customer_id} AND card_payment.payment_status = 'OK' and refund = '' order by time desc ${pagination}`;
    paymentTransaction_data_query = `select transaction_time time,a.id, merchant_id customer_id, order_ref order_id, firstname, lastname, address, (gross/100) -${deductPaymentsFeeQuery} total, (fee/100) -${deductPaymentsFeeQuery} fees, net/100 payed, b.provider_name provider, '' refund, last_4_digits, transaction_method_id origin, psp_reference VendorTxCode, internal_reference CrossReference, b.provider_name payment_provider, '' description,'' more_info, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status from payments a, payment_providers b where ${payment_query_string} a.payment_provider_id = b.id and merchant_id = ${params.customer_id} and transaction_status_id in (1,3,4,5,6) and gross > 0 order by transaction_time desc ${pagination}`;
    finalQuery = `select * from ((${transactionsQuery}) union all (${cardpayment_data_query}) union all (${paymentTransaction_data_query})) data order by time desc ${pagination}`;
  } else if (params.status == "REFUND") {
    if (
      params.customer_type === "OMNIPAY" &&
      params.payment_provider === "DNA"
    ) {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees  - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and refund is not null and a.merchant_id = ${params.customer_id} and payment_status not in ('UNTRIED', 'INBATCH') order by a.created_at desc ${pagination}`;
    } else {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees  - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status = 'OK' and refund is not null order by a.created_at desc ${pagination}`;
    }
    cardpayment_data_query = `SELECT time, card_payment.id, customer_id, order_id, firstname, lastname, address, total - ${deductCardPaymentFeeQuery} total, fees - ${deductCardPaymentFeeQuery} fees, payed,  provider, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider,'' description, '' more_info, card_payment.payment_status FROM card_payment AS card_payment FORCE INDEX (customer_id) WHERE ${query_string} card_payment.customer_id = ${params.customer_id} AND card_payment.payment_status = 'OK' and refund != '' order by time desc ${pagination}`;
    paymentTransaction_data_query = `select transaction_time time,a.id, merchant_id customer_id, order_ref order_id, firstname, lastname, address, (gross/100) -${deductPaymentsFeeQuery} total, (fee/100) -${deductPaymentsFeeQuery} fees, net/100 payed, b.provider_name provider, '' refund, last_4_digits, transaction_method_id origin, psp_reference VendorTxCode, internal_reference CrossReference, b.provider_name payment_provider, '' description,'' more_info, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status from payments a, payment_providers b where ${payment_query_string} a.payment_provider_id = b.id and merchant_id = ${params.customer_id} and transaction_status_id in (2,3,4,5,6) and gross < 0 order by transaction_time desc ${pagination}`;
    finalQuery = `select * from ((${transactionsQuery}) union all (${cardpayment_data_query}) union all (${paymentTransaction_data_query})) data order by time desc ${pagination}`;    
  } else {
    if (
      params.customer_type === "OMNIPAY" &&
      params.payment_provider === "DNA"
    ) {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees  - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status not in ('UNTRIED', 'INBATCH') order by a.created_at desc ${pagination}`;
    } else {
      transactionsQuery = `select a.created_at time, a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total - ${deductPaymentTransactionFeeQuery} total, a.fees  - ${deductPaymentTransactionFeeQuery} fees, a.payed, a.provider, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description,ifnull(more_info, '') more_info, a.payment_status from payment_transaction a, payment_transaction_details b where ${query_string_trans} a.id = b.payment_transaction_id and a.merchant_id = ${params.customer_id} and payment_status = 'OK' order by a.created_at desc ${pagination}`;
    }
    cardpayment_data_query = `SELECT time, id, customer_id, order_id, firstname, lastname, address, total - ${deductCardPaymentFeeQuery} total, fees - ${deductCardPaymentFeeQuery} fees, payed,  provider, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider,'' description, '' more_info, card_payment.payment_status FROM card_payment AS card_payment FORCE INDEX (customer_id) WHERE ${query_string} card_payment.customer_id = ${params.customer_id} AND card_payment.payment_status = 'OK' order by time desc ${pagination}`;
    paymentTransaction_data_query = `select transaction_time time,a.id, merchant_id customer_id, order_ref order_id, firstname, lastname, address, (gross/100) -${deductPaymentsFeeQuery} total, (fee/100) -${deductPaymentsFeeQuery} fees, net/100 payed, b.provider_name provider, '' refund, last_4_digits, transaction_method_id origin, psp_reference VendorTxCode, internal_reference CrossReference, b.provider_name payment_provider, '' description,'' more_info, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status from payments a, payment_providers b where ${payment_query_string} a.payment_provider_id = b.id and merchant_id = ${params.customer_id} and transaction_status_id in (1,2,3,4,5,6) order by transaction_time desc ${pagination}`;
    finalQuery = `select * from ((${transactionsQuery}) union all (${cardpayment_data_query}) union all (${paymentTransaction_data_query})) data order by time desc ${pagination}`;
  }
  let paymentsTransactions = await sequelizeInstance.query(finalQuery, {
    raw: true,
    type: sequelizeInstance.QueryTypes.SELECT,
  });
  paymentsTransactions = lodash.orderBy(
    paymentsTransactions,
    ["time"],
    ["desc"]
  );
  return paymentsTransactions;
};

module.exports.gettransactionListV5 = async (params) => {

  let query_string = '';
  let from = new Date(params.from);
  let to = new Date(params.to);

  let query_string_trans = '';
  let payment_query_string = '';
  let card_payment_force_key = ` FORCE INDEX (customer_id) `;
  if (params.via == "DAY") {
    card_payment_force_key = ` FORCE INDEX (date_search) `
    query_string = ` day = '${from.getDate()}' and month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.from}' + INTERVAL 1 day and`;
  } else   if (params.via == "WEEK") {

    Date.prototype.getWeek = function() {
      var dt = new Date(this.getFullYear(),0,1);
      return Math.ceil((((this - dt) / 86400000) + dt.getDate()+1)/7);
    };
    
    let week = from.getWeek();
    console.log("WeekNumber", week);
    query_string = ` week_no = '${week}' and year = '${from.getFullYear()}' and`;

    function getDateByWeek(week, year) {
      var d = new Date(year, 0);
      var dayNum = d.getDay();
      var requiredDate = --week * 7;
      if (dayNum != 0 || dayNum > 4) {
        requiredDate += 7;
      }
      d.setDate(1 - d.getDay() + ++requiredDate);
      return d;
    }

    let date = getDateByWeek(week,from.getFullYear()).toISOString().slice(0, 10);
    console.log(date);
    query_string_trans = `a.created_at between '${date}' and '${date}' + interval 1 week  and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + interval 1 week  and`;
  }  else if (params.via == "MONTH") {
    query_string = ` month = '${from.getMonth()+1}' and year = '${from.getFullYear()}' and`;
    let date = `${from.getFullYear()}-${from.getMonth()+1}-01`;  
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 month and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 month and`;
  } else if (params.via == "YEAR") {
    query_string = ` year = '${from.getFullYear()}' and`;
    let date = `${from.getFullYear()}-01-01`;
    query_string_trans = `a.created_at between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
    payment_query_string = `a.transaction_time between '${date}' and '${date}' + INTERVAL 1 YEAR and`;
  } else if (params.via == "RANGE") {
    card_payment_force_key = ` FORCE INDEX (time) `
    query_string = `time between '${params.from}' and '${params.to}' and year between '${from.getFullYear()}' and '${to.getFullYear()}' and`;
    query_string_trans = `a.created_at between '${params.from}' and '${params.to}' and`;
    payment_query_string = `a.transaction_time between '${params.from}' and '${params.to}' and`;
  }
  
  let transactionsQuery;
  if (params.customer_type === "OMNIPAY" && params.payment_provider === 'DNA') {
    transactionsQuery = `SELECT a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total, a.fees, a.payed, a.provider, a.created_at time, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description, a.payment_status 
                          FROM payment_transaction a, payment_transaction_details b 
                          WHERE ${query_string_trans} a.id = b.payment_transaction_id 
                          AND a.merchant_id = ${params.customer_id} 
                          AND payment_status not in ('UNTRIED', 'INBATCH')`;
  } else {
    transactionsQuery = `SELECT a.id, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.address, a.total, a.fees, a.payed, a.provider, a.created_at time, a.refund, a.last_4_digits, b.origin,concat('O',a.order_id,'M',merchant_id,'T',a.id) VendorTxCode, a.cross_reference CrossReference, a.payment_provider, ifnull(description,'') description, a.payment_status 
                          FROM payment_transaction a, payment_transaction_details b 
                          WHERE ${query_string_trans} 
                          a.id = b.payment_transaction_id 
                          AND a.merchant_id = ${params.customer_id} 
                          AND payment_status = 'OK'`;
  }

  let cardpayment_data = await sequelizeInstance.query(
    `SELECT 
      card_payment.id id, customer_id, order_id, firstname, lastname, address, 
      total original_total,
      fees original_fees,
      ifnull(round(psc.amount/100,2), 0.00) service_charge,
      round(total - (ifnull(round(psc.amount/100,2), 0.00)),2) total, 
      round(fees - (ifnull(round(psc.amount/100,2), 0.00)),2) fees,
      payed,  provider, time, refund, last_4_digits, origin, VendorTxCode, CrossReference, payment_provider, ifnull(more_info,'') more_info
      FROM card_payment ${card_payment_force_key} 
      LEFT JOIN payments_split_commission psc 
        ON card_payment.id = psc.merchant_payments_id 
        AND psc.commission_type_id = 6 
        AND psc.payment_status = 1 
        AND transaction_table = 'card_payment'
      WHERE ${query_string} 
      card_payment.customer_id = ${params.customer_id} 
      AND card_payment.payment_status = 'OK'`
    , { raw: true, type: sequelizeInstance.QueryTypes.SELECT });

  let transactions = await sequelizeInstance.query(transactionsQuery, { raw: true, type: sequelizeInstance.QueryTypes.SELECT })

  let paymentsTransactions = await sequelizeInstance.query(
    `SELECT 
      a.id, a.merchant_id customer_id, a.order_ref order_id, firstname, lastname, address, 
      round(gross/100,2) original_total,
      round(fee/100,2) original_fees,
      ifnull(round(psc.amount/100,2), 0.00) service_charge,
      round((gross - ifnull(psc.amount, 0))/100,2) total, 
      round((fee - ifnull(psc.amount, 0))/100,2) fees,      
      b.provider_name provider, transaction_time time, '' refund, last_4_digits, transaction_method_id origin, psp_reference VendorTxCode, internal_reference CrossReference, b.provider_name payment_provider, '' description, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status 
    FROM payments a
    JOIN payment_providers b on a.payment_provider_id = b.id 
    LEFT JOIN payments_split_commission psc 
      ON a.id = psc.merchant_payments_id 
      AND psc.commission_type_id = 6 
      AND psc.payment_status = 1 
      AND transaction_table = 'payments'
    WHERE ${payment_query_string} 
      a.payment_provider_id = b.id 
      AND a.merchant_id = ${params.customer_id} 
      AND transaction_status_id in (1,2,3,4,5,6)`
    , { raw: true, type: sequelizeInstance.QueryTypes.SELECT });
  cardpayment_data.push(...transactions);
  cardpayment_data.push(...paymentsTransactions);
  cardpayment_data = lodash.orderBy(cardpayment_data, ['time'], ['desc']);
  
  return  cardpayment_data;
};

//fine tuned balance query to use balance index to get result
module.exports.cardPaymentSum = (params) => {
  return payment.sum("payed", {
    where: {
      [Op.and]: [
        { [Op.or]: { payment_status: "OK", withdraw_status: { [Op.gt]: 0 } } },
        { delete_status: { [Op.ne]: 1 } },
        { customer_id: params.customerId },
      ],
    },
    indexHints: [{ type: "FORCE", values: ["balance"] }],
  });
};

module.exports.getPaymentsBalanceSum = (params) => {
  return payments.findAll({
    where: {
      [Op.and]: [
        {
          withdrawn_status: 0,
          delete_status: 0 ,
          merchant_id: params.customerId,
          transaction_status_id: { [Op.in]: [1, 2] }
        },
      ],
    },
    attributes: [
      [Sequelize.fn("round", Sequelize.fn("sum", Sequelize.literal('net/100')), 2), "sum"],
    ],
  });
}

module.exports.getPaymentsBalanceTransitSum = (params) => {
  return payments.findAll({
    where: {
      [Op.and]: [
        {
          withdrawn_status: 0,
          delete_status: 0 ,
          merchant_id: params.customerId,
          transaction_status_id: { [Op.in]: [1, 2] },
          payment_provider_id: { [Op.in]: [5] }//only ADYEN is the balance in transit for now
        },
      ],
    },
    attributes: [
      [Sequelize.fn("round", Sequelize.fn("sum", Sequelize.literal('net/100')), 2), "sum"],
    ],
  });
}

//suffix 'it' -> stand for internal trasfer
//total amount of internal transfer the client has done
module.exports.itDoneByClient = (params) => {
  return internalTransferTransaction.sum("amount", {
    where: {
      [Op.and]: [
        { status: { [Op.ne]: "CANCELED" } },
        { customer_id: params.customerId },
      ],
    },
  });
};

// total amount of internal transfer the client has received
module.exports.itRecievedByClient = (params) => {
  return internalTransferTransaction.sum("amount", {
    where: {
      [Op.and]: [
        { status: { [Op.in]: ["COMPLETE", "REFUNDED", "DISPUTING"] } },
        { recipient_id: params.customerId },
      ],
    },
  });
};

// total refund the client has received from suppliers
module.exports.itClientRecievedFromSuppliers = (params) => {
  return sequelizeInstance.query(
    `SELECT ROUND(sum(internal_transfer_refund.amount), 2) AS total FROM internal_transfer_refund LEFT JOIN internal_transfer_transaction ON internal_transfer_transaction_ref = ref WHERE internal_transfer_transaction.customer_id=${params.customerId}`
  );
};

// toal refund the client has given to suppliers
module.exports.refundGivenToSuppliers = (params) => {
  return sequelizeInstance.query(
    `SELECT ROUND(sum(internal_transfer_refund.amount), 2) AS total FROM internal_transfer_refund LEFT JOIN internal_transfer_transaction ON internal_transfer_transaction_ref = ref WHERE recipient_id=${params.customerId}`
  );
};

// get pdq transaction monthly
module.exports.getPdqTransactions = (params) => {
  console.log("pauu", params);
  return PdqTransactions.findAll({
    where: {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("MONTH", Sequelize.col("date_time")),
          params.month
        ),
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("date_time")),
          params.year
        ),
        { merchant_id: params.merchantId },
      ],
    },
    order: [["date_time", "DESC"]],
    attributes: { exclude: ["transaction_id"] },
  });
};

module.exports.getPdqTransactionsCount = (params) => {
  console.log("params", params);
  return PdqTransactions.findAll({
    where: {
      [Op.and]: [
        { transaction_status_id: params.transaction_status_id },
        { merchant_id: params.merchantId },
        Sequelize.where(
          Sequelize.fn("MONTH", Sequelize.col("date_time")),
          params.month
        ),
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("date_time")),
          params.year
        ),
      ],
    },
    attributes: [
      [Sequelize.fn("sum", Sequelize.col("total")), "total"],
      [Sequelize.fn("count", Sequelize.col("id")), "count"],
      "refund_status",
    ],
    group: ["refund_status"],
  });
}

// get invoice
module.exports.getInvoice = (params) => {
  let invoiceWhere = {
    [Op.and]: [
      Sequelize.where(
        Sequelize.fn("MONTH", Sequelize.col("date_sent")),
        params.month
      ),
      Sequelize.where(
        Sequelize.fn("YEAR", Sequelize.col("date_sent")),
        params.year
      ),
      { customer_id: params.merchantId },
    ],
  }
  if(params.via === 'YEAR'){
    invoiceWhere = { [Op.and]: [ Sequelize.where( Sequelize.fn("YEAR", Sequelize.col("date_sent")),
     params.year),{ customer_id: params.merchantId }]}
  }
  return Invoice.findAll({
    where: invoiceWhere,
    offset: params.offset,
    limit:params.limit,
    order: [["id", "DESC"]],
  });
};

module.exports.getInvoiceCount = (params) => {
  let invoiceWhere = {
    [Op.and]: [
      Sequelize.where(
        Sequelize.fn("MONTH", Sequelize.col("date_sent")),
        params.month
      ),
      Sequelize.where(
        Sequelize.fn("YEAR", Sequelize.col("date_sent")),
        params.year
      ),
      { customer_id: params.merchantId },
    ],
  }
  if(params.via === 'YEAR'){
    invoiceWhere = { [Op.and]: [ Sequelize.where( Sequelize.fn("YEAR", Sequelize.col("date_sent")),
    params.year),{ customer_id: params.merchantId }]}
  }
  const InvoicesCount = Invoice.count({
    where: invoiceWhere,
    order: [["id", "DESC"]],
  });
  
  return InvoicesCount
};
// total chargeback
module.exports.chargeBack = (params) => {
  // return sequelizeInstance.query(`SELECT ROUND(sum(internal_transfer_refund.amount), 2) AS total FROM internal_transfer_refund LEFT JOIN internal_transfer_transaction ON internal_transfer_transaction_ref = ref WHERE recipient_id=${params.customerId}`)

  //     return sequelizeInstance.query(`SELECT *,cb.reason as cb_reason,cb.id as cb_id from card_payment cp JOIN charge_back cb
  //     ON cb.payment_id = cp.id
  //     WHERE cp.customer_id=${params.merchantId} order by cp.id desc
  // `)
  // return sequelizeInstance.query(`SELECT cp.id, cb_id, cb_reason, reason, firstname, lastname, address, time, total,outcome ,cb.reason as cb_reason,cb.id as cb_id from card_payment cp JOIN charge_back cb ON cb.payment_id = cp.id WHERE (cp.customer_id=${params.merchantId} and cp.month=${params.month} and cp.year=${params.year}) order by cp.id desc;`)

  return sequelizeInstance.query(`
    SELECT
card_payment.id as id,
charge_back.id as cb_id,
charge_back.reason as cb_reason,
card_payment.reason as reason,
card_payment.firstname as firstname,
card_payment.lastname as lastname,
card_payment.address as address,
card_payment.time as time,
card_payment.total as total,
charge_back.outcome as outcome

 from card_payment JOIN charge_back ON card_payment.id = charge_back.payment_id WHERE (card_payment.customer_id=${params.merchantId} and card_payment.month=${params.month} and card_payment.year=${params.year}) order by card_payment.id desc
    `);
};

module.exports.getStripeAccId = (merchant_id) => {
  return Customers.findOne({
    attributes: ["stripe_acc_id", "id"], //object
    where: { id: merchant_id },
    raw: true,
  });
};

module.exports.getStripeCredentials = (merchant_id) => {
  return Customers.findOne({
    attributes: ["stripe_acc_type"],
    where: { id: merchant_id },
    raw: true,
  });
};

module.exports.getLargePayments = (params) => {

  let query = `SELECT order_id,customer_id,firstname,lastname,address,time,total from card_payment force key (date_search)
  where total > 75 and payment_status = 'OK' AND order_id != ''`;

  if (params.day) {
    query = `${query} and day = :day`;
  }
  if (params.month) {
    query = `${query} and month = :month`;
  }
  query = `${query} and year = :year order by id desc limit ${params.offset},${params.pagination_size}`;
  return sequelizeInstance.query(query, {
    replacements: {
      day: params.day,
      month: params.month,
      year: params.year
    },
    type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.getCustomerType = (merchant_id) => {
	return Customers.findOne({
        attributes: ['customer_type', 'payment_provider'], //object
        where: {id: merchant_id}
    });
}

module.exports.getCustomers = async (params) => {
  return Customers.findOne({
      where: {
          id: params.customerId
      }
  })
}

module.exports.GetTxnFeeInfo = async (params) => {
  let payment_providers_card_payment = ['CARDSTREAM','BARCLAYS','JUDOPAY','OPTOMANY','STRIPE','VOUCHER','WALLET']; 
  let payment_providers_payment_transaction = ['ADYEN','DNA'];
  
  if(payment_providers_card_payment.includes(params.payment_provider)){
    //card_payment
    return await payment.findOne({
      attributes: [['fees', 'fees']],
      where: {
        id: params.payment_id,
        delete_status: 0 ,
        payment_status: 'OK'
      },
      raw: true
    });
  }
  
  if(payment_providers_payment_transaction.includes(params.payment_provider)){
    //payment_transaction
    return await payment_transaction.findOne({
      attributes: [['fees', 'fees']],
      where: {
        id: params.payment_id,
        payment_status: 'OK'
      },
      raw: true
    });
  }

  return await payments.findOne({
    attributes: [
      [Sequelize.fn("round",Sequelize.literal('fee / 100'),2), 'fees']
    ],
    where: {
      id: params.payment_id,
      delete_status: { [Op.ne]: 1 },
      transaction_status_id: { [Op.between]: [1, 6] }
    },
    raw: true
  });
}

module.exports.GetSplitTxnFeeInfo = async (params) => {
  let query = `SELECT 
                  ROUND(psc.amount/100,2) amount,
                  commission_type,
                  c.business_name as parter_name
                FROM payments_split_commission psc 
                JOIN split_commission_types sct ON psc.commission_type_id = sct.id 
                JOIN customers c ON psc.partner_merchant_id = c.id
                WHERE 
                  psc.merchant_payments_id = ${params.payment_id} AND
                  psc.payment_status = 1`
  let paymentsTransactions = await sequelizeInstance.query(query,
  {raw: true, type: sequelizeInstance.QueryTypes.SELECT});
  return  paymentsTransactions;
}

module.exports.GetDetailsBySearch = async (params) => { 
  let data = await sequelizeInstance.query(
    `select a.id, a.internal_customer_id, a.customerId,  a.customer_id, a.order_id, a.firstname, a.lastname, a.more_info, a.address, a.email, a.total, a.fees, a.payed, a.VendorTxCode, a.VPSTxId, a.SecurityKey, a.CrossReference, a.week_no, a.day, a.month, a.year, a.payment_status, a.payment_provider, a.provider, a.ip, a.last_4_digits, a.time, a.withdraw_status, a.refund, a.TxAuthNo, a.delete_status, a.correlation_id, a.origin, a.method, "" as cross_reference, "" as psp_reference, "" as internal_reference, "0" as transaction_mode_id, 
    "0" as transaction_method_id, "0" as payment_provider_id, "0" as week, null as refund_reason_id, "" as country_code, "0" as gross, "0" as net, "" as currency_code, "0" as transaction_status_id, "" as reason from card_payment a where ${params}`,
    { raw: true, type: sequelizeInstance.QueryTypes.SELECT }
);

  params = params.replace('.customer_id', '.merchant_id') 
  params.includes("firstname")? params = params.split("a.").join('b.').replace('b.merchant_id', 'a.merchant_id')  : ''
  let payment_transaction = await sequelizeInstance.query(
    `select a.id, null as internal_customer_id, "" as customerId, a.merchant_id customer_id, a.order_id, b.firstname, b.lastname, b.more_info, b.address, a.email ,a.total, a.fees, a.payed, "" as VendorTxCode, "" as VPSTxId, "" as SecurityKey, "" as CrossReference, "" as week_no, null as day, "0" as month, "0" as year, a.payment_status, a.payment_provider, a.provider, "" as ip, a.last_4_digits, "" as time, "0" as withdraw_status, "" as refund, "" as TxAuthNo, "0" as delete_status, "" as correlation_id, b.origin ,b.method, a.refund, a.cross_reference,  "" as psp_reference, "" as internal_reference, "0" as transaction_mode_id, 
    2 as transaction_method_id, "0" as payment_provider_id, "0" as week, null as refund_reason_id, "" as country_code, "0" as gross, "0" as net, "" as currency_code, 2 as transaction_status_id, "" as reason from payment_transaction a, payment_transaction_details b where a.id = b.payment_transaction_id and ${params} and a.payment_status = 'OK'`,
    { raw: true, type: sequelizeInstance.QueryTypes.SELECT }
  );
  params.includes("firstname")? params = params.split("b.").join('a.') : ""


  params.includes(".order_id")? params = params.replace('.order_id', '.order_ref') : ""
  let payments = await sequelizeInstance.query(
    `select a.id, "" as internal_customer_id, "" as customerId, a.merchant_id customer_id, a.order_ref as order_id, a.firstname, a.lastname, null as more_info, a.address, a.email_address email, "0" as total, a.fee, "0" as payed, "" as VendorTxCode, "" as VPSTxId, "" as SecurityKey, "" as CrossReference, "" as week_no, a.day, a.month, a.year, case when a.transaction_status_id = 2 then 'REFUND' ELSE 'OK' end payment_status,"" as payment_provider, "" as provider, a.source_ip as ip, a.last_4_digits, a.transaction_time as time, a.withdrawn_status, null as refund, a.TxAuthNo, a.delete_status, "" as correlation_id, "" as origin, "" as method, "" as cross_reference, a.psp_reference, a.internal_reference, a.transaction_mode_id, a.transaction_method_id, a.payment_provider_id, a.week, a.refund_reason_id, a.country_code, a.gross, a.net, a.currency_code, a.transaction_status_id, a.reason from payments a where ${params} and a.transaction_status_id in (1,2,3,4,5,6);
    `,
    { raw: true, type: sequelizeInstance.QueryTypes.SELECT });

  data.push(...payment_transaction);
  data.push(...payments);
  return data;
};
module.exports.GetPaymentMonthlyTransaction = async (params) => {
  let data = [];
  let cardPaymentData = await payment.findAll({
    attributes: ["id", "customer_id", "order_id", "firstname", "lastname", "address", "total", "fees", "payed",  "provider", "time", "refund", "last_4_digits", "origin", "VendorTxCode", "CrossReference", "payment_provider",[Sequelize.literal('"card_payment"'),'from_table'], ],
    where : {
      [Op.and]: [
        {
      customer_id: params.customerId,
      month: moment.tz("Europe/London").month() + 1,
      year:  moment.tz("Europe/London").year()
        }
      ],
    },
    raw: true
  });

  let paymentsData = await payments.findAll({
    attributes: [`id`, `order_ref`, `merchant_id`, `country_code`, `gross`, `fee`, `net`, `currency_code`, `payment_provider_id`, `transaction_time`, `transaction_status_id`, `reason`, `withdrawn_status`, `source_ip`, `last_4_digits`, `firstname`, `lastname`, `email_address`, `address`, `refund_reason_id`, `delete_status`, `psp_reference`, `internal_reference`, `day`, `week`, `month`, `year`, `transaction_mode_id`, `transaction_method_id`, `TxAuthNo`,[Sequelize.literal('"payments"'),'from_table']],
    where : {
      [Op.and]: [
        {
      merchant_id: params.customerId,
      month: moment.tz("Europe/London").month() + 1,
      year:  moment.tz("Europe/London").year()
        }
      ],
    },
    raw: true
  });

  let paymentTransactionData = await payment_transaction.findAll({
    attributes: [`id`, `merchant_id`, `order_id`, `provider`, `total`, `fees`, `payed`, `refund`, `cross_reference`, `email`, `payment_status`, `payment_provider`, `last_4_digits`, `created_at`, `updated_at`,[Sequelize.literal('"payment_transaction"'),'from_table']],
    where : {
      [Op.and]: [
        Sequelize.where(
          Sequelize.fn("MONTH", Sequelize.col("created_at")),
          moment.tz("Europe/London").month() + 1
        ),
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("created_at")),
          moment.tz("Europe/London").year()
        ),
        {
        merchant_id: params.customerId,
        }
      ],
    },
    raw: true
  });
  data.push(...cardPaymentData, ...paymentsData, ...paymentTransactionData)

  return data;
};
