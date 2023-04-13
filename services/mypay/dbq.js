'use strict';
const Customer = require('../../database/model/customers')
const Payment = require('../../database/model/payment')
const MypayUsersCardstreamSettings = require('../../database/model/mypay_users_cardstream_settings')
const MypayItem = require('../../database/model/mypay_items')
const MypayShopper = require('../../database/model/mypay_shoppers')
const MypayTempTransaction = require('../../database/model/mypay_temp_transactions')
const MypayCardstreamTransactionLog = require('../../database/model/mypay_card_stream_transactions_log');
const MypayTempTransactionsMeta = require('../../database/model/mypay_temp_transaction_meta');
const AutoSettlingTransaction = require('../../database/model/payment_transaction')
const HostedForms = require('../../database/model/hosted_forms');
const DnaResponse = require('../../database/model/dna_response');

module.exports.getCustomer = async (params) => {
  return await Customer.findOne({
    attributes: ['payment_provider','business_name','customer_type'],
    where: {
      id: params.merchant_id
    },
    raw: true
  });
};


module.exports.getCsSettings = async (params) => {
  return await MypayUsersCardstreamSettings.findOne({
    where: {
      customer_id: params.merchant_id
    },
    raw: true
  })
}


module.exports.createItem = async (params) => {
  return await MypayItem.create({
    data: params.data,
    ref: params.ref
  });
}

module.exports.createShopper = async (params) => {
  return await MypayShopper.create({
    ref : params.ref,
    first_name : params.first_name,
    last_name : params.last_name,
    email : params.email,
    address : params.address,
    description: params.description,
    recipients_email: params.recipients_email
  });
}

module.exports.createHostedFormEntry = async (params) => {
  return await HostedForms.create({...params});
}

module.exports.capturePaybyLinkData = async (params) => {
  return await HostedForms.create({
    uuid : params.uuid,
    pay_by_link_details : params.pay_by_link_details
  });
}

module.exports.getHostedForm = async (params) => {
  return await HostedForms.findOne({
    where: {
      uuid: params.uuid
    },
    raw: true
  });
};

module.exports.createTempTransactions = async (params) => {
  return await MypayTempTransaction.create({
    ref: params.ref,
    customer_id: params.customer_id,
    user_order_ref: params.user_order_ref,
    shopper_id: params.shopper_id,
    item_id: params.item_id,
    amount: params.amount,
    currency_code: params.currency_code,
    status : params.status,
    meta_id: params.meta_id,
    invoice_expiry_date: params.invoice_expiry_date,
    link_expiry_date: params.link_expiry_date
  });
}

module.exports.updateTempTransaction = async (params) => {
  return await MypayTempTransaction.update({
    status : 'PROCESSED'},{
    where: { ref : params.ref }
  });
}
module.exports.createCsTransactionLog = async (params) => {
  return await MypayCardstreamTransactionLog.create({
    action: params.action,
    xref: params.xref,
    raw_response: params.raw_response
  });
}

module.exports.createPayment = async (params) => {
  return await Payment.create(params);
}

module.exports.createTempTransactionMeta = async (params) =>{
  return await MypayTempTransactionsMeta.create({
    data: params.meta_data,

  });
};


module.exports.createAutoSettlingTransaction = async (params) =>{
  return await AutoSettlingTransaction.create({
    order_id: params.order_id,
    email:params.email,
    total: params.amount,
    fees: 0,
    payed: params.amount,
    payment_provider: params.payment_provider,
    origin: params.origin,
    payment_status: params.payment_status,
    last_4_digits: params.last_4_digits,
    merchant_id: params.merchant_id,
    invoice_id: params.order_id
  });
};

module.exports.updateAutoSettlingTransaction = async (params) =>{
  return await AutoSettlingTransaction.update({
    order_id: params.order_id,
    // email:params. ,
    total: params.amount,
    cross_reference: params.id,
    fees: 0,
    payed: params.amount,
    payment_status: params.payment_status,
    last_4_digits: params.cardPanStarred.substr(params.cardPanStarred.length - 4)
  },{
    where: { order_id : params.order_id }
  });
};

module.exports.saveDnaResponse = async (dna_response, order_id) =>{
  return await DnaResponse.create({
    dna_response,
    order_id
  });
};

module.exports.checkForOrderId = async (order_id) =>{
  return await AutoSettlingTransaction.findOne({
    where: {
      order_id
    },
    raw: true
  });
};
