const moment = require('moment-timezone');
const payment = require('../../database/model/payment')
const customer = require('../../database/model/customers')
const { Sequelize } = require('../../database')
const Op = Sequelize.Op

module.exports.addPaymentRecord = (info) => {


    return new Promise((resolve, reject) => {
        payment.create({
            customer_id: info.merchant_id,
            firstname: info.first_name,
            lastname: info.last_name,
            address: info.address,
            email: info.email,
            total: parseFloat(info.total).toFixed(2),
            payed: info.payed,
            provider: info.provider,
            payment_status: info.payment_status,
            CrossReference: info.CrossReference,
            payment_provider: info.payment_provider,
            order_id: info.order_id,
            week_no: info.week_no,
            fees: info.fees,
            SecurityKey: info.SecurityKey,
            VendorTxCode: info.VendorTxCode,
            VPSTxId: info.VPSTxId,
            ip: info.ip,
            withdraw_status: '0',
            delete_status: '0'

        }).then((paymentRecord) => {
            if (paymentRecord) {
                console.log('record added successfully')
                resolve(paymentRecord)
            }
            else {
                console.log('failed while adding the record')
                reject()
            }
        })
    })

}

module.exports.getPaymentStatus = (info) => {
    let { order_id, merchant_id } = info;
    return new Promise((resolve, reject) => {
        payment.findOne({
            attributes: ['order_id', 'payment_status'],
            where: { order_id, payment_status: "OK", customer_id: merchant_id, month: parseInt(moment().tz("europe/london").month()) + 1 }
        })
            .then((values) => {
                try {
                    resolve(values.dataValues)
                }
                catch (err) {
                    reject(err)
                }

            }, (err) => {
                reject(err)
            })
    })
}

module.exports.updatePaymentRecord = (info) => {

    let { payment_status, transactionId, last4digits, paymentIntentId } = info
    return new Promise((resolve, reject) => {
        payment.update({
            payment_status,
            last_4_digits: last4digits,
            VendorTxCode: paymentIntentId
        },
            {
                where: { id: transactionId }
            })
            .then((success) => {
                console.log(success)
                resolve()
            }, (err) => {
                reject(err)
            })

    })
}

module.exports.getCustomerDetails = (customerId) => {
    return new Promise((resolve, reject) => {
        customer.findOne({
            where: { id: customerId }
        }).then((values) => {
            try {
                resolve(values.dataValues)
            }
            catch (err) {
                console.log('problem while fetching the customer details')
                reject(err)
            }
        })

    })
}

module.exports.updateStripeAccountId = (customerId, payload) => {
    let { stripe_user_id,
        stripe_publishable_key,
        refresh_token,
        access_token } = payload
    return new Promise((resolve, reject) => {
        customer.update({
            stripe_acc_id: stripe_user_id,
            // stripe_pk: stripe_publishable_key,
            // stripe_sk: access_token,
            // stripe_payload: JSON.stringify(payload)
        },
            {
                where: { id: customerId }
            }).then(success => {
                console.log('imres')
                resolve(success)
            }, (err) => {
                reject(err)
            })

    })

}