const moment = require('moment-timezone');
const payment = require('../../database/model/payment')
const batch = require('../../database/model/batch')
const batchItem = require('../../database/model/batch_item')
const customer = require('../../database/model/customers')
const otherCustomer = require('../../database/model/other_customer_details')
const WithdrawalProgressStatus = require('../../database/model/withdrawal_progress_status')
const payout_batch = require('../../database/model/payout_batch')
const PayoutTransaction = require('../../database/model/payout_transaction');
const { Sequelize,sequelizeInstance } = require('../../database')
const InternalTransferTransaction = require('../../database/model/internal_transfer_transaction')
const payout_batch_item = require('../../database/model/payout_batch_item')
const Op = Sequelize.Op
const Payments = require('../../database/model/payments')


module.exports.pendingPayment = (info) => {
    let { customerId } = info;
    return new Promise((resolve, reject) => {
        payment.findAll({
            attributes: ['total'],
            where: {
                customer_id: customerId,
                firstname: "withdraw",
                payment_status: { [Op.not]: "INBATCH" },
                withdraw_status: '1',
                delete_status: '0'
            },
            order: [['time', 'ASC']],
            attributes: [
                "id",
                "customer_id",
                "order_id",
                "firstname",
                "lastname",
                "address",
                "total",
                "payed",
                "day",
                "month",
                "year",
                "time",
                "withdraw_status"
            ]
        })
            .then((values) => {
                try {
                    let total = 0;
                    values.map((item) => {
                        total = parseFloat(total) + parseFloat(item.total)
                    })
                    resolve({ totalWithdrawalAmount: total.toFixed(2) })

                    console.log('the total withdrawls made by him is : ', total)
                }
                catch (e) {
                    console.log('except', e)
                    reject(e)

                }
            })
    })
}


module.exports.cardPaymentWithdrawal = (params) => {
    return payment.findAll({
        where: {
            [Op.and]: [
                { firstname: 'withdraw' },
                { delete_status: '0' },
                { customer_id: params.customerId },
                { time: { [Op.between]: [params.startDate, params.endDate] } },
                { payment_status: 'UNTRIED' },
                { withdraw_status: '1' }
            ]
        },
        order: [['time', 'desc']],
        attributes: [['id','card_payment_id'],"total", "fees", "payed", "week_no", "day", "month", "year", "time", "withdraw_status", "refund", "method"]
    })
}

module.exports.getBatch = (params) => {
    return batch.findAll({
        where: {
            [Op.and]: [
                { customer_id: params.customerId },
                { status: { [Op.ne]: 'FINALISED' } },
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('date_pending')), params.year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('date_pending')), params.month),
            ]
        },
        order: [
            ['batch_id', 'DESC']
        ],
        attributes: [
            "batch_id",
            "customer_id",
            "total",
            "status",
            "date_pending",
            "date_sent",
            "date_complete",
            "week_no",
            "not_received",
            "not_received_date",
            "account_number",
            "sort_code",
            "bank_name",
            "account_holder"
        ]
    })
}

module.exports.getPayoutBatch = (params) => {
  return payout_batch.findAll({
    where: {
      [Op.and]: [
        { customer_id: params.customerId },
        { status: { [Op.ne]: "FINALISED" } },
        Sequelize.where(
          Sequelize.fn("YEAR", Sequelize.col("date_pending")),
          params.year
        ),
        Sequelize.where(
          Sequelize.fn("MONTH", Sequelize.col("date_pending")),
          params.month
        ),

        // {week_no: params.week}
      ],
    },
    order: [["batch_id", "DESC"]],
    attributes: [
      "batch_id",
      "customer_id",
      [Sequelize.fn("round", Sequelize.literal('total/100'), 2), "total"],
      "status",
      "date_pending",
      "date_sent",
      "date_complete",
      "week_no",
      "not_received",
      "not_received_date",
      "account_number",
      "sort_code",
      "bank_name",
      "account_holder",
    ],
  });
};

module.exports.getBatchItems = (batchId) => {
    return batchItem.findAll({
        where: { batch_id: batchId },
        order: [
            ['batch_item_id', 'DESC']
        ],
        attributes: [
            "batch_item_id",
            "batch_id",
            "card_payment_id",
            "customer_id",
            "date_issued",
            "total",
            "not_received"
        ]
    })
}

module.exports.getPayoutBatchItems = (batchIds) => {
    return payout_batch_item.findAll({
        where: { batch_id: {[Op.in]:  batchIds } },
        order: [
            ['batch_item_id', 'DESC']
        ],
        attributes: [
            "batch_item_id",
            "batch_id",
            "card_payment_id",
            "customer_id",
            "date_issued",
            "not_received",
            [Sequelize.fn("round", Sequelize.literal('total/100'), 2), "total"],
        ]
    })
}

// insert into card_payment (customer_id, ip, firstname, address, total, payed, withdraw_status,`year`,`month` ) values ('$customer_Id', '$Users_IP_address', 'withdraw', 'Status: <i>Request Sent</i>.',
module.exports.createWithdrawalRequest = (params) => {
    return payment.create({
        customer_id: params.customerId,
        ip: params.ip,
        firstname: "withdraw",
        total: Math.abs(params.amount) * -1,
        payed: Math.abs(params.amount) * -1,
        delete_status: '0',
        withdraw_status: "1",
        year: new Date().getFullYear(),
        month: new Date().getMonth(),
        address: "Status: <i>Request Sent</i>."
    })
}

module.exports.checkWithdrawalCount = (params) => {
    return sequelizeInstance.query(
        `SELECT count(1) count FROM batch
        WHERE customer_id = '${params.customerId}'
        AND status = 'SENT'
        AND DATE(date_pending) > '${params.cutoffDate}'`,
        { type: Sequelize.QueryTypes.SELECT })
}

module.exports.disableWithdrawalOnce = (params) => {
    return customer.update(
        {
            enabled_withdrawal_once: "DISABLED"
        },
        {
            where: { id: params.customerId }
        });
}

module.exports.updateBalance = (params) => {
    return customer.update(
        {
            balance: params.updated_balance,
            balance_updated: Sequelize.fn('NOW')
        },
        {
            where: { id: params.customer_id }
        });
}

module.exports.updateWithdrawalProgress = (params) => {
    console.log(params);
    return WithdrawalProgressStatus.upsert({
        status: params.status,
        customer_id: params.customer_id
    },
        {
            where: { customer_id: params.customer_id }
        });
}

module.exports.getWithdrawalProgress = (params) => {
    const WITHDRAWAL_PROGRESS_CUTOFF_SECONDS = 30
    return WithdrawalProgressStatus.findOne({
        attributes: ['id'],
        where: {
            [Op.and]: [
                {
                    customer_id: params.customer_id,
                    status: params.status,
                },
                Sequelize.where(
                    Sequelize.fn("TIME_TO_SEC", Sequelize.fn("TIMEDIFF", Sequelize.fn("NOW"), Sequelize.col("updated_at"))), {
                    [Op.lte]: WITHDRAWAL_PROGRESS_CUTOFF_SECONDS
                }
                )
            ]
        },
        raw: true
    });
    //SELECT `id` FROM `withdrawal_progress_status`
    //WHERE ((`withdrawal_progress_status`.`customer_id` = 63184000 AND `withdrawal_progress_status`.`status` = 'IN_PROGRESS')
    //AND TIME_TO_SEC(TIMEDIFF(NOW(), `updated_at`)) < WITHDRAWAL_PROGRESS_CUTOFF_SECONDS) LIMIT 1;
}

module.exports.fetchUserEmailPhone = (params) => {
    return customer.findOne({
        attributes: ['customers_email', 'customers_mobile', 'clients_fname'], //object
        where: {
            id: params.id
        }, raw: true
    });
}

module.exports.accountValidation = (params) => {

    return otherCustomer.findOne({
        attributes: [
            "customers_id",
            "sortcode",
            "accountnumber"
        ],
        where: {
            [Op.and]: [
                { customers_id: params.customerId },
                { sortcode: params.sortCode },
                { accountnumber: params.accountNumber }
            ]
        },
        raw: true
    });
}

module.exports.getPaymentMethod = (card_payment_id) => {
    return payment.findOne({
        where: {
            id: card_payment_id
        }
    });
}


module.exports.updateBatch = (params) => {
    let query;
    if (params.status === 'RESEND') {
        query = `UPDATE batch SET status = 'PENDING', date_sent = '', date_complete = '', date_pending =:date_pending, not_received = 0 WHERE batch_id =:batch_id LIMIT 1`
    }
    if (params.status === 'NOT-RECEIVED') {
        query = `UPDATE batch SET not_received = 1, not_received_date =:date_not_received WHERE batch_id =:batch_id LIMIT 1`
    }
    if (params.status === 'CANCEL') {
        query = `UPDATE batch SET  not_received = 0 WHERE batch_id =:batch_id LIMIT 1`
    }

    return sequelizeInstance.query(query, {
        replacements: {
            batch_id: params.batch_id,
            date_not_received: params.current_datetime,
            date_pending: params.current_datetime,
        }, type: Sequelize.QueryTypes.UPDATE
    });
}

module.exports.getNotReceivedPayouts = () => {
    const query = `SELECT b.batch_id, b.customer_id as merchant_id, b.date_complete, b.not_received_date, b.total,c.business_name,c.business_phone_number FROM batch b JOIN customers c ON c.id = b.customer_id WHERE b.not_received = '1' order by b.customer_id;`
    return sequelizeInstance.query(query, { type: Sequelize.QueryTypes.SELECT });
}

module.exports.getBatchById = (params) => {
    return batch.findOne({
        where: {
            batch_id: params.batch_id
        }
    })
}

module.exports.updateWithdrawalNotBatched = (params) => {
    const query = `update card_payment set delete_status='1',more_info = CONCAT(more_info,';','${params.delete_message}')
    where id="${params.payment_id}" limit 1`;

    return sequelizeInstance.query(query, { type: Sequelize.QueryTypes.UPDATE });
}

module.exports.getPayoutTransaction= async (params)=>{
    return  PayoutTransaction.findAll({
        attributes: ['amount','currency','payment_provider','provider_reference','status','expected_date'],
        where: {
            [Op.and]: [
                { merchant_id: params.merchant_id },
                //{ status: { [Op.ne]: 'FAILED' } },
                // { more_info: { [Op.like]: '%Confirmed%' }},
                { provider_reference: { [Op.ne]: 'no_provider_reference' }},
                Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('created_at')), params.year),
                Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('created_at')), params.month),
            ]
        }
    });     
}

module.exports.getPendingWithdrawals = (info) => {
    let { customer_id } = info;
    return new Promise((resolve, reject) => {
        payment.findAll({
            attributes: ['total'],
            where: {
                customer_id: customer_id,
                firstname: "withdraw",
                payment_status: { [Op.not]: "INBATCH" },
                withdraw_status: '1',
                delete_status: '0'
            },
            order: [['time', 'ASC']],
            attributes: [
                "id",
                "customer_id",
                "order_id",
                "firstname",
                "lastname",
                "address",
                "total",
                "payed",
                "day",
                "month",
                "year",
                "time",
                "withdraw_status"
            ]
        })
            .then((values) => {
                try {
                    let total = 0;
                    values.map((item) => {
                        total = parseFloat(total) + parseFloat(item.total)
                    })
                    resolve({ totalWithdrawalAmount: total.toFixed(2) })

                    console.log('the total withdrawls made by him is : ', total)
                }
                catch (e) {
                    console.log('except', e)
                    reject(e)

                }
            })
    })
}

module.exports.createWithdrawalReversal = (params) => {

    return payment.update(
        {
            delete_status: 1,
            more_info: 'Cancelled Due to suspicious transaction'
        },
        {
            where: { customer_id: params.customerId, withdraw_status: 1, delete_status: 0, firstname: 'withdraw' }
        });
}

module.exports.getPendingTransactions = (params) => {
    return batch.findAll({
        where: { customer_id: params.customerId, status: 'PENDING' }, raw: true,
        attributes: [
            "batch_id"
        ]
    })
}

module.exports.getPendingBatchItem = (params) => {

    return batchItem.findAll({
        where: { batch_id: params }, raw: true,
        attributes: [
            "card_payment_id"
        ]
    })
}

module.exports.reverseCardpaymentDetails = (params) => {

    return payment.update(
        {
            delete_status: 1,
            more_info: 'Cancelled Due to suspicious transaction'
        },
        {
            where: { id: params }
        });
}



module.exports.reversePendingTransactions = (params) => {

    return batch.update(
        {
            status: "FAILED"
        },
        {
            where: { batch_id: params }, raw: true
        });
}


module.exports.getPendingInternalTransfers = (info) => {
    let { customer_id } = info;
    return new Promise((resolve, reject) => {
        InternalTransferTransaction.findAll({
            attributes: ['amount'],
            where: {
                customer_id: customer_id,
                status: "pending"
            },
            attributes: [
                "amount"
            ]
        })
            .then((values) => {
                try {
                    let amount = 0;
                    values.map((item) => {
                        amount = parseFloat(amount) + parseFloat(item.amount)
                    })
                    resolve({ internalTransferAmount: amount.toFixed(2) })

                    console.log('the total internal transfer made by him is : ', amount)
                }
                catch (e) {
                    console.log('except', e)
                    reject(e)

                }
            })
    })
}

module.exports.cancelInternalTransfer = (params) => {

    return InternalTransferTransaction.update(
        {
            status: 'CANCELED'
        },
        {
            where: { customer_id: params.customerId, status: 'PENDING' }
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

module.exports.getPayments = (params) => {
    return Payments.findAll({
        attributes: ['id','transaction_time'],
        where: {
            id: {[Op.in]:  params.paymentIds }
        }
    })
}