const {
  sequelizeInstance,
  Sequelize
} = require("../../database");

const ChargeBack = require('../../database/model/chargeback');
const Payment = require('../../database/model/payment');
const Customer = require('../../database/model/customers');
const RiskCheckResponse = require('../../database/model/risk_check_response');

module.exports.getChargeBack = (params) => {
  const attributes = ['id']
  return ChargeBack.findOne({
    attributes: attributes,
    where: {
      payment_id: params.payment_id
    }
  })
}


module.exports.getCustomer = (params) => {
  const attributes = ['customers_number']
  return Customer.findOne({
    attributes: attributes,
    where: {
      id: params.id
    },
  })
}

module.exports.getRiskCheckResponse = (params) => {
  const attributes = ['risk_check_id'];
  return RiskCheckResponse.findOne({
    attributes: attributes,
    where: {
      cardpayment_id: params.cardpayment_id
    },
  })
}


module.exports.pushChargeBack = (params) => {
  return ChargeBack.create(params)
}

module.exports.pushPayment = (params) => {
  return Payment.create(params)
}

module.exports.getPayment = (params) => {
  const attributes = ['id', 'firstname', 'lastname', 'total', 'payed', 'customerId', 'order_id', 'customer_id', 'ip', 'address', 'other', 'refund', 'transaction_id',
    'correlation_id', 'inserted', 'delete_status', 'CardType', 'VendorTxCode', 'VPSTxId', 'TxAuthNo', 'SecurityKey', 'more_info',
    'CrossReference', 'inthere', 'withdraw_status', 'withdraw_date', 'csv_status', 'payment_status', 'reason', 'week_id',
    'week_no', 'payment_provider'
  ]
  return Payment.findOne({
    attributes: attributes,
    where: {
      id: params.id
    }
  })
};

module.exports.chargeBack = (params) => {
  const query = `
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
        from card_payment JOIN charge_back ON card_payment.id = charge_back.payment_id WHERE (card_payment.customer_id=:customer_id and card_payment.month=:month and card_payment.year=:year) order by card_payment.id desc
    `;

  return sequelizeInstance.query(query, {
    replacements: {
      customer_id: params.merchantId,
      month: params.month,
      year: params.year
    },
    type: Sequelize.QueryTypes.SELECT
  });
};

module.exports.chargeBackYearlyData = (params) => {
  const query = `SELECT
                      cp.id as id,
                      cp.reason as reason,
                      cp.firstname as firstname,
                      cp.lastname as lastname,
                      cp.address as address,
                      cp.time as time,
                      cp.total as total,
                      cb.id as cb_id,
                      cb.outcome as outcome,
                      cb.reason as cb_reason
               from card_payment cp force key (customer_id) JOIN charge_back cb
                  ON cb.payment_id = cp.id
                  WHERE  cp.customer_id = :customer_id
                  and time > (now() - interval 1 year)
                  order by cp.id desc`;

  return sequelizeInstance.query(query,
    {
      replacements: {
        customer_id: params.merchantId
      },
      type: Sequelize.QueryTypes.SELECT
    });
}

module.exports.getChargeBackTxn = (params) => {
  const query = `
  SELECT
      cp.customer_id,
      cp.time,
      cp.total,
      cp.payment_provider,
      cp.payment_status,
      cp.last_4_digits,
      cp.CrossReference,
      cp.TxAuthNo,
      cp.firstname,
      cp.lastname,
      cp.address,
      cb.id,
      cb.date,
      cp.id as chargeback_id,
      cb.reason,
      cb.comments,
      cb.outcome,
      cb.tel

  FROM
      card_payment cp force KEY (date_search)
      LEFT JOIN charge_back cb ON cp.id = cb.payment_id
  WHERE
      cp.day = :day
      AND cp.month = :month
      AND cp.year = :year
      AND cp.total = :total
      AND cp.payment_status = 'OK'`;
  return sequelizeInstance.query(query, {
    replacements: {
      day: params.day,
      month: params.month,
      year: params.year,
      total: params.total
    }, type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.fetchChargeBackDetails = (params) => {
  return ChargeBack.findOne({
    attributes: ['date', 'reason', 'comments', 'outcome'],
    where: {
      payment_id: params.transaction_id,
      customer_id: params.customer_id
    }
  })
}
