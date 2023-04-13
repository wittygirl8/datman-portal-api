
const helpers = require('../../library/helpers')
/**
 * Takes the order details and return session id
 * @param {object} orderDetails 
 */

module.exports.stripeCreateCheckoutSession = (orderDetails, paymentReferences) => {
    let { successUrl, cancelUrl, clientReferenceId, stripe_sk, stripe_acc_id, currency } = paymentReferences
    let { name, email, total } = orderDetails
    // let {stripe_sk, stripe_pk} = customerInfo
    const stripe = require('stripe')(stripe_sk);
    console.log("stripeCreateCheckoutSession")

    return new Promise((resolve, reject) => {

        stripe.checkout.sessions.create({

            payment_method_types: ['card'],
            customer_email: email,
            client_reference_id: clientReferenceId,

            line_items: [{
                name: name,
                amount: `${parseInt(total * 100)}`,
                currency,
                quantity: 1
            }],

            payment_intent_data: {
                application_fee_amount: parseInt(parseFloat(helpers.feeCalculation(total, 2.00, 0.00)).toFixed(2) * 100),
                // on_behalf_of: stripe_acc_id
            },
            success_url: successUrl,
            cancel_url: cancelUrl
        }, {
            stripe_account: stripe_acc_id
        })
            .then((session) => {
                if (session.id) return resolve(session.id)
                reject()
            }, (err) => {
                reject(err)
            })
    })
}

// module.exports.paymentIntentsRetrive = (id, stripeDetails)=>{
//     let {stripe_sk, stripe_pk} = stripeDetails
//     let stripe = require('stripe')(stripe_sk)

//     return new 


// }