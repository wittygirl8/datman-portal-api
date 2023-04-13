const payment = require('../../database/model/payment');
const paymentTransaction = require("../../database/model/payment_transaction");
const OptmanyRefund = require('../../database/model/optmany_refund')
const OptomanyPayment = require('../../database/model/optmany_payment')
const customer = require('../../database/model/customers')
const MypayUsersCardstreamSettings = require('../../database/model/mypay_users_cardstream_settings')
const CardstreamRefundLog = require('../../database/model/cardstream_refund_log')
const RefundRequestLog = require('../../database/model/refund_request_log')
const DnaRefundLog = require('../../database/model/dna_refund_log')
const paymentTransactionDetails = require('../../database/model/payment_transaction_details');
const payments = require("../../database/model/payments");

const {
    sequelizeInstance,
    Sequelize
} = require("../../database");
const RefundStatus = require("../../database/model/refund_status");
const Payment = require('../../database/model/payment')
module.exports.Op = Sequelize.Op

module.exports.getCustomers = async (params) => {
    // "SELECT * FROM card_payment WHERE order_id = :order_id AND payment_status ='OK' AND customer_id = :customer_id LIMIT 1";
    return customer.findOne({
        where: {
            id: params.customerId
        }
    })
}

module.exports.getTransaction = async (params) => {
    // "SELECT * FROM card_payment WHERE order_id = :order_id AND payment_status ='OK' AND customer_id = :customer_id LIMIT 1";
    return payment.findOne({
        where: {
            order_id: params.orderId,
            customer_id: params.customerId,
            payment_status: params.paymentStatus
        }
    })
}

module.exports.mypayGetTransaction = async (params) => {
    // "SELECT * FROM card_payment WHERE order_id = :order_id AND payment_status ='OK' AND customer_id = :customer_id LIMIT 1";
    return payment.findOne({
        where: {
            id: params.card_payment_id,
            customer_id: params.customer_id,
            payment_status: params.payment_status,
            VendorTxCode: params.VendorTxCode
        }
    })
}

module.exports.mypayGetPaymentTransaction = async (params) => {
  return paymentTransaction.findOne({
    where: {
      id: params.card_payment_id,
      merchant_id: params.merchant_id,
      payment_status: params.payment_status,
      payment_provider: params.payment_provider,
      cross_reference: params.cross_reference
    },
  });
};

module.exports.mypayGetPayments = async (params) => {
    return payments.findOne({
      where: {
        id: params.card_payment_id,
        merchant_id: params.merchant_id,
        payment_transaction_id: params.payment_status,
        payment_provider_id: params.payment_provider,
        psp_reference: params.cross_reference
      },
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

module.exports.createCardStreamRefundLog = async (params) => {
    return await CardstreamRefundLog.create({
        card_payment_id: params.card_payment_id,
        xref: params.xref,
        amount: params.amount,
        outcome: params.outcome,
    }, {
        return: true
    })
}

module.exports.createDnaRefundLogs = async (params) => {
    return await DnaRefundLog.create({
        payment_id: params.payment_id,
        raw_data: params.raw_data
    }, {
      return: true
    })
  };

module.exports.updatePaymentRefund = async (params) => {
    return payment.update(
        {
            refund: params.refund_reason
        },
        {
            where: { id: params.id }
        }
    )
}

module.exports.createPaymentRefund = async (params) => {
    return payment.create(params, {
        return: true
    })
}

module.exports.createDNAPaymentRefund = async (params) => {
    return paymentTransaction.create(params, {
        return: true
    })
}

module.exports.updateDNAPaymentRefund = async (params) => {
    return paymentTransaction.update(
        {
            refund: params.refund_reason
        },
        {
            where: { id: params.id }
        }
    )
}

module.exports.getPaymentTransactionDetails = async (params) => {
    return paymentTransactionDetails.findOne({
        where: {
          payment_transaction_id: params.payment_id,
        },
      })
}


module.exports.createPaymentTransactionDetails = async (params) => {
    return paymentTransactionDetails.create(params, {
        return: true
    })
}

module.exports.createRefundRequestLog = async (params) => {
    return RefundRequestLog.create({
        card_payment_id: params.card_payment_id,
        silent_mode: params.silent_mode,
        refund_amount: params.amount,
        json_payload: JSON.stringify(params.payload),
    }, {
        return: true
    })
}

module.exports.updateTransaction = (params) => {
    return payment.update(
        {
            refund: params.reason,
            total: '0.00',
            fees: '0.00',
            payed: '0.00'
        },
        {
            where: { id: params.id }
        }
    )
}

/**
 * create a record on optmany refund
 */
module.exports.createOptmanyRefund = (params) => {
    return OptmanyRefund.create({
        card_payment_id: params.cardPaymentId,
        refrence: params.refrence,
        amount: params.amount
    }, {
        return: true
    })
}

/**
 * find if refrence already exists
 */
module.exports.getRefund = (params) => {
    return OptmanyRefund.findOne({
        where: { reference: params.reference }
    })
}

/**
 * Fetch the record from optomanyPayment
 */
module.exports.getOptomanyPayment = (params) => {
    return OptomanyPayment.findOne({
        where: { card_payment_id: params.cardPaymentId }
    })
}

/**
 * update the optomany with outcome and other details for previously seeded entry
 */
module.exports.updateOptmanyRefund = (params) => {
    return OptmanyRefund.update(
        {
            outcome: params.outcome,
            reason: params.reason,
            card_payment_id: params.cardPaymentId
        },
        {
            where: { id: params.optomanyRefundId }
        }
    )
}


module.exports.searchRefund = (params) => {
    let query = `
                           SELECT cp.id, c.business_name, cp.customer_id, total,VendorTxCode, CrossReference, firstname, lastname, address, refund, time, cp.payment_provider,
                           (case when rfs.status = 'REFUND-PROCESSED' then 'PROCESSED' else 'NOT-PROCESSED' end) refund_processed_status
                           FROM card_payment cp force key (date_search) left join refund_status rfs on cp.id = rfs.cardpayment_id
                           join customers c on cp.customer_id = c.id
                           WHERE (cp.refund like '%Refunded%')
                           AND (cp.total > 0 or cp.total = '0.00') `;

    if (params.day) {
        query = `${query} AND cp.day = :day`;
    }

    query = `${query} AND cp.month = :month AND cp.year = :year
                    AND c.business_name not like '%testing%'
                    order by cp.id desc`
    return sequelizeInstance.query(query, {
        replacements: {
            day: params.day,
            month: params.month,
            year: params.year
        }, type: Sequelize.QueryTypes.SELECT
    });
}

module.exports.pushRefundStatus = (params) => {
    return RefundStatus.create({
        cardpayment_id: params.payment_id,
        status: params.status
    });
}

module.exports.getPaymentInfo = (params) => {
    return Payment.findOne({
        attributes: ['payment_status', 'id'],
        where: {
            id: params.payment_id
        }
    });
}

module.exports.getRefundStatusInfo = (params) => {
    return RefundStatus.findOne({
        attributes: ['id', 'cardpayment_id', 'status'],
        where: {
            cardpayment_id: params.payment_id
        }
    });
}
module.exports.getPayment = async (params) => {
    let query_parameters = {
        where: params.where,
        raw: true
    }
    if (params.attributes) {
        query_parameters['attributes'] = params.attributes
    }
    return payment.findAll(query_parameters)
}

module.exports.getPaymentTransactions = async (params) => {
    let query_parameters = {
        where: params.where,
        raw: true
    }
    if (params.attributes) {
        query_parameters['attributes'] = params.attributes
    }
    return paymentTransaction.findAll(query_parameters)
}

module.exports.getQueryData = async (query) => {
    return sequelizeInstance.query(
        query,
        { type: Sequelize.QueryTypes.SELECT }
    )
}

module.exports.getRefundedPayment = (params) => {
    const query = `SELECT id,total,payed,refund FROM card_payment
                force key (CrossReference)
                WHERE CrossReference =:CrossReference
                AND payment_status = 'OK'
                AND total < 0
                order by id desc`;

    return sequelizeInstance.query(query, {
        replacements: {
            CrossReference: params.CrossReference
        },
        type: Sequelize.QueryTypes.SELECT
    });
}

module.exports.getPaymentTransactionRefundedPayment = (params) => {
    const query = `SELECT id,total,payed,refund FROM payment_transaction
    force key (cross_reference)
    WHERE cross_reference =:cross_reference
    AND payment_status = 'OK'
    AND total < 0
    order by id desc`;

    return sequelizeInstance.query(query, {
    replacements: {
    cross_reference: params.cross_reference
    },
    type: Sequelize.QueryTypes.SELECT
    });
} 

module.exports.getFeeInfo = (params) => {
    const query = `SELECT percentage_fee,fixed_fee FROM fee_tiers f join customers c on f.id = c.fee_tier_id WHERE c.id = :merchant_id LIMIT 1`;

    return sequelizeInstance.query(query, {
        replacements: {
            merchant_id: params.merchant_id
        },
        type: Sequelize.QueryTypes.SELECT
    });
}

module.exports.getAccountStatus = (params) => {

    return customer.findOne({
        attributes: ['status'],
        where : {
            id : params.customer_id
        },raw:true
    });
}
