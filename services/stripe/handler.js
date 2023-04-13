const async = require('async');
const request = require('request')
const { getPaymentStatus,
    addPaymentRecord,
    getCustomerDetails,
    updatePaymentRecord,
    updateStripeAccountId
} = require('./dbq')
const { stripeCreateCheckoutSession } = require('../../library/lib/stripe')
const { updateT2sOrder } = require('../../library/lib/t2s_webhooks')
const { decrypt, getSplitTransaction } = require('../../library/helpers')
const helpers = require('../../library/helpers')


let decryptRequest = (encryptedData, cb) => {
    let encryptionMethod = 'AES-256-CBC';
    let secret = "ytyf3Ex2dV=3@#eQL7UgcWvNk^w*+L5h";
    let iv = secret.substr(0, 16);
    // let encryptedData = info;
    let decryptData = decrypt(encryptedData, encryptionMethod, secret, iv);
    try {
        console.log('the decrepyted value is :', decryptData)
        cb(null, JSON.parse(decryptData))
    }
    catch (err) {
        cb({ message: err })
    }
}

let checkAlreadyPaid = (info, cb) => {
    getPaymentStatus(info).then((val) => {
        console.log('The payment is done for current order')
        checkoutContinue = false
        cb(true)
    }, (err) => {
        console.log('Order is not paid why?', err)
        cb(false)
    })


}

let submit = (info, reqHeaders, urlData, cb) => {

    console.log('here are the reqHeaders', reqHeaders)
    let ip = reqHeaders['CF-Connecting-IP'] || ""
    console.log('this is the ip => ', ip)
    let fee = parseFloat(helpers.feeCalculation(info.total, 2.00, 0.00)).toFixed(2)


    info['payment_status'] = "UNTRIED"
    info['CrossReference'] = `O${info.order_id}M${info.merchant_id}C${info.customer_id}`
    info['payment_provider'] = 'STRIPE'
    info['VPSTxId'] = ''
    info['VendorTxCode'] = ''
    info['SecurityKey'] = ''

    info['ip'] = ip
    info['fees'] = fee

    info['payed'] = parseFloat(parseFloat(info.total).toFixed(2) - fee).toFixed(2)
    info['SecurityKey'] = ''
    info['week_no'] = ''

    addPaymentRecord(info).then((sucess) => {
        console.log('the record added form submit', sucess.dataValues.id)
        try {
            let transactionId = sucess.dataValues.id
            cb(null, info, reqHeaders, transactionId, urlData)
        }
        catch (e) {
            cb(e)
        }
    })
}

let getStripeDetails = (info, reqHeaders, transactionId, urlData, cb) => {
    console.log('the  value of info is ::',
        info)
    getCustomerDetails(info['merchant_id']).then((customerInfo) => {
        console.log('data form db', customerInfo)
        if (!customerInfo.stripe_acc_id && !customerInfo.currency) {
            cb('stripe keys are missing')
        }
        cb(null, info, reqHeaders, customerInfo, transactionId, urlData)
    }, (err) => {
        cb(err)
    })
}

let LIVE_DOMAIN = "https://stripe.datmancrm.com/v1/"
// let LIVE_DOMAIN = "https://l5rx5bvji5.execute-api.eu-west-1.amazonaws.com/dev/"

let sessionCheckout = (info, reqHeaders, customerInfo, transactionId, urlData, cb) => {
    let paymentReferences = {
        // successUrl: info.provider != "FH" ? `https://www.${info.host}` : "https://www.foodhub.com", 
        successUrl: `${LIVE_DOMAIN}sp-datman-redirect?data=${urlData}`,
        cancelUrl: info.provider != "FH" ? `${LIVE_DOMAIN}sp-datman-failure?data=${urlData}&d=${info.host}` : `${LIVE_DOMAIN}sp-datman-failure?data=${urlData}&d=foodhub.co.uk`,
        // successUrl: `https://stripe.datmancrm.com/v1/sp-datman-failure?data=${urlData}`,
        // cancelUrl: info.provider != "FH" ? `https://www.${info.host}` : "https://www.foodhub.com",         
        clientReferenceId: `T${transactionId}O${info.order_id}M${info.merchant_id}C${info.customer_id}`,
        stripe_sk: process.env.PROD_STRIPE_SK,
        stripe_pk: process.env.PROD_STRIPE_PK,
        currency: customerInfo.currency,
        stripe_acc_id: customerInfo.stripe_acc_id
    }
    console.log('paymentREFFFFF', paymentReferences)
    let orderDetails = {
        name: info.first_name,
        email: info.email,
        total: info.total
    }
    //add payment status to UNTRIED

    stripeCreateCheckoutSession(orderDetails, paymentReferences).then((sessionId) => {

        console.log('sessionId', sessionId)
        cb(null, sessionId, paymentReferences)
    }, (err) => {
        console.log(err)
        cb(err)
    })
}
module.exports.stripePay = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    if (event.hasOwnProperty('keep-warm')) {
        console.log('Call is just to warm the lamda function')
        return callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: { message: 'warm is done' }
        })
    }
    // console.log('lets look in event',event)
    // console.log('lets see the raw data from FE', event.queryStringParameters.data)
    // let body = JSON.parse(event.body)
    // if(!event.queryStringParameters)
    let reqHeaders = event.headers
    let urlData = event.queryStringParameters.data;
    let encryptedData = Buffer.from(urlData, 'base64').toString('ascii')
    console.log('here you go with encrypted datat', urlData, encryptedData)

    decryptRequest(encryptedData, (err, reqBody) => {
        if (err) {
            callback(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
                },
                statusCode: 200,
                body: JSON.stringify({ message: "failed", err: "Decryption issue" })
            })
        }

        if (!reqBody.hasOwnProperty('merchant_id') ||
            !reqBody.hasOwnProperty('order_id') ||
            !reqBody.hasOwnProperty('customer_id') ||
            !reqBody.hasOwnProperty('total') ||
            !reqBody.hasOwnProperty('provider') ||
            !reqBody.hasOwnProperty('host')) {
            console.log('some keys are missing')
            callback(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
                },
                statusCode: 200,
                body: JSON.stringify({ message: "failed", err: "mandatory keys are missing merchant_id,order_id, customer_id, total, provider, host " })
            })
            // let err = `Required keys are missing these are must 
            //         reqBody.merchant_id
            //         reqBody.order_id
            //         reqBody.customer_id 
            //         total 
            //         provider
            //         host`
            // cb(err)
        }

        checkAlreadyPaid(reqBody, (isPaid) => {
            if (isPaid) {
                return callback(null, {
                    statusCode: 301,
                    headers: {
                        location: `https://stripe.datmancrm.com/v1/sp-datman-redirect?data=${urlData}`,
                    },
                    body: null
                })
            }
            console.log("Order is not paid let's move to checkout")
            async.waterfall([

                function dummy(cb) {
                    cb(null, reqBody, reqHeaders, urlData)
                },
                // decryptRequest,
                // checkAlreadyPaid,      
                submit,
                getStripeDetails,
                sessionCheckout,
                // submit

            ], (err, sessionId, paymentReferences) => {
                if (err) {
                    let cErr;
                    try {
                        cErr = err.toString('ascii').replace('£', '&pound;')
                    }
                    catch (e) {
                        err = 'unknown error'
                    }
                    callback(null, {
                        statusCode: 400,
                        headers: {
                            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                            "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS 
                            "content-type": "text/html"
                        },
                        // '${err.replace('£', '&pound;')}'
                        body: `
                        <p>&nbsp;</p>
                        <h1>2002 - Something went wrong</h1>
                        <blockquote>
                           Sorry we cannot the process payment at the moment.
                           <p>&nbsp;</p>
                           <table width="488">
                              <tbody>
                                 <tr>
                                    <td><em><span style="color: #999999;" >
                                       <font size="1">
                                       
                                       '${cErr}'
                                       </font>
                                       </span></em>
                                    </td>
                                 </tr>
                              </tbody>
                           </table>
                        </blockquote>
                        `
                    })
                }

                console.log('hey all the result', sessionId)

                callback(null, {
                    statusCode: 200,
                    headers: {
                        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                        "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS 
                        'content-type': 'text/html'

                    },
                    // body: JSON.stringify({ message: "pass", sessionId })
                    body: `
                    <html>
                    <script>
                    if (top.location != location) {
                        top.location.href = document.location.href ;
                      }
                    </script>
                    <script src="https://js.stripe.com/v3/"> </script>
                    <script>
                       var stripe = Stripe('${paymentReferences.stripe_pk}', {
                        stripeAccount: '${paymentReferences.stripe_acc_id}'
                       })
                       stripe.redirectToCheckout({
                           sessionId: '${sessionId}'
                       }).then(function (result) {
                           console.log('result:', result)
                       });
                    </script>                   
                 </html>
                    `
                })
            })
        })
    })

}


let handleCheckoutSession = (CrossReference, last4digits, paymentIntentId) => {
    console.log('the provided ref id id :', CrossReference)
    let transactionId = getSplitTransaction(CrossReference).transactionId
    return new Promise((res, rej) => {
        updatePaymentRecord({ payment_status: "OK", transactionId, last4digits, paymentIntentId })
            .then(() => {
                res()

            }, (err) => {
                console.log("error:", err)
                rej()
            })
    })
}
module.exports.stripePaymentStatus = (event, context, callback) => {
    if (event.hasOwnProperty('keep-warm')) {
        console.log('Call is just to warm the lamda function')
        return callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: { message: 'warm is done' }
        })
    }

    context.callbackWaitsForEmptyEventLoop = false
    let body = JSON.parse(event.body)
    // console.log('my--body', body)
    // let {client_reference_id} = JSON.parse(event.body)
    // console.log('the given id is : ', body.data.object.client_reference_id)
    // const sig = request.headers['stripe-signature'];
    const sig = event.headers['Stripe-Signature']
    console.log('stripePaymentStatus_headers', event.headers)
    let c_event;
    let stripeObject = body.data.object
    let stripeCustomerId = stripeObject.customer
    let stripeReference = stripeObject.client_reference_id
    let datmanClinetId = getSplitTransaction(stripeReference).merchantId
    let orderId = getSplitTransaction(stripeReference).orderId
    let paymentIntentId = stripeObject.payment_intent
    let accountId = body.account
    console.log('my body', body)
    console.log('object body', stripeObject)

    // console.log('The order id and the total is : ', orderId, OrderTotal)


    // console.log('trying', customerInfo)
    let stripe = require('stripe')(process.env.PROD_STRIPE_SK)
    console.log('stripe', stripe)
    c_event = stripe.webhooks.constructEvent(event.body, sig, process.env.PROD_STRIPE_WEBHOOK)
    console.log('checkout.session.completed,', c_event)

    if (c_event.type === 'checkout.session.completed') {
        // checkout.session.completed
        console.log('im here', accountId)
        stripe.paymentIntents.retrieve(
            paymentIntentId, {
            stripe_account: accountId
        },
            function (err, paymentIntent) {
                if (err) {
                    console.log('if it', err)
                    return callback(null, {
                        statusCode: 400,
                        body: JSON.stringify({ received: false, err })
                    })
                }
                console.log('im here tooo')
                console.log('the payment methods', paymentIntent)
                let last4digits = paymentIntent.charges.data[0].payment_method_details.card.last4
                let OrderTotal = parseFloat(paymentIntent.amount / 100)
                console.log('the last 4 digits are', last4digits)

                handleCheckoutSession(stripeReference, last4digits, paymentIntentId).then(() => {
                    updateT2sOrder(OrderTotal, orderId).then((success) => {
                        callback(null, {
                            statusCode: 200,
                            body: JSON.stringify({ received: true })
                        })
                    }, (err) => {
                        callback(null, {
                            statusCode: 400,
                            body: JSON.stringify({ received: false, err })
                        })
                    })


                }, (err) => {
                    callback(null, {
                        statusCode: 400,
                        body: JSON.stringify({ received: false, err })
                    })

                })

            }
        )
    }
    else {
        console.log('checkout.session.completed,', c_event)
    }
    try {

    } catch (err) {
        console.log('something crash', err)
        callback(null, {
            statusCode: 400,
            body: JSON.stringify({ received: false, err: err.message })
        })
    }
}

module.exports.stripeFailure = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    callback(null, {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            'content-type': 'text/html'
        },
        body: `
        <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>Payment Error</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">

                    <!-- Latest compiled and minified CSS -->
                    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.4/css/bootstrap.min.css">
                    <!-- Latest compiled and minified JavaScript -->
                    <script src="https://code.jquery.com/jquery-1.11.3.min.js"></script>
                    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js" integrity="sha512-K1qjQ+NcF2TYO/eI3M6v8EiNYZfA95pQumfvcVrTHtwQVDG+aHRqLi/ETn2uB+1JqwYqVG3LIvdm9lj6imS/pQ==" crossorigin="anonymous"></script>
                </head>
                <body>
                <div class="container">
                    <div class="row">
                        <div class="col-md-6 col-md-offset-3">
                            <h2>Sorry, we can't process your request.</h2>

                            <a class="btn btn-block loadingBtn btn-success btn-lg" data-loading-text="Processing, please wait..." href="https://stripe.datmancrm.com/v1/stripe-pay?data=${event.queryStringParameters.data}" class="button" target="_self" >Try Again</a><br><br>
                          
                            <a class="btn btn-block loadingBtn btn-danger btn-lg" data-loading-text="Processing, please wait..." href="https://${event.queryStringParameters.d}/paymentSP.php?simple=1&data=${event.queryStringParameters.data}&do=cancel&stripe=true" class="button" target="_self" >Cancel Order</a>
                        </div>
                    </div>
                </div>
                <script>
                </script>
                </body>
                </html>        
        `

    })

}

module.exports.redirect = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    if (event.hasOwnProperty('keep-warm')) {
        console.log('Call is just to warm the lamda function')
        return callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: { message: 'warm is done' }
        })
    }
    let urlData = event.queryStringParameters.data;
    let encryptedData = Buffer.from(urlData, 'base64').toString('ascii')
    decryptRequest(encryptedData, (err, reqBody) => {
        if (err) {
            return callback(null, {
                headers: {
                    "Access-Control-Allow-Origin": "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS 
                },
                statusCode: 200,
                body: JSON.stringify({ message: "fail", err })
            })
        }
        callback(null, {
            statusCode: 301,
            headers: {
                location: reqBody.provider === "FH" ? `https://order.foodhub.co.uk/payment.php?simple=1&bSuccess&id=${reqBody.order_id}` : `https://${reqBody.host}/payment.php?simple=1&bSuccess&id=${reqBody.order_id}`
            },
            body: null
        })

    })
}

module.exports.teststripe = (event, context, callback) => {
    console.log('test env', process.env.MODE)
    // console.log('event:=>', event)
    // console.log('context:=> ', context)
    // console.log('pingpong', JSON.parse(event.requestContext.authorizer.payload).merchant_id)
    if (event.hasOwnProperty('keep-warm')) {
        console.log('Call is just to warm the lamda function')
        return callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: { message: 'warm is done' }
        })
    }
    console.log('this should not exexute while warming')
    callback(null, {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            'content-type': 'text/html'
        },
        body: `
        <p>hru</p>
        `
    })

}


let LambdaHttpResponse = (statusCode, payload, callback) => {

    callback(null, {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(payload)
    })

}


module.exports.createCustomerAccount = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let reqHeaders = event.headers;
    let customerId = event.queryStringParameters.id;

    let { country, email, business_name } = JSON.parse(event.body)
    // let country = 'GB';
    // let email= 'pythi@g.co';
    // let business_name = 'pthon';
    // let currency = 'gbp';

    console.log('event', event)

    // //test start

    // let stripe_user_id = 'acct_abcdefghij'

    // LambdaHttpResponse('200', {
    //     stripe_user_id,
    //     redirect_url: `https://dashboard.stripe.com/connect/accounts/${stripe_user_id}`
    // }, callback)
    // return

    // //test end 
    const stripe = require("stripe")(process.env.PROD_STRIPE_SK);
    stripe.accounts.create({
        type: 'custom',
        country,
        email,
        requested_capabilities: ['card_payments', 'transfers'],
        business_profile: {
            name: business_name
        },
        // default_currency: currency,
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: reqHeaders['CF-Connecting-IP'] || "0.0.0.0" // Assumes you're not using a proxy
        }
    }, function (err, account) {
        if (err) {
            return LambdaHttpResponse('400', err, callback)
        }
        let stripe_user_id = account.id
        console.log(err)
        console.log(account)
        updateStripeAccountId(customerId, { stripe_user_id }).then(() => {
            // let test_url = `https://dashboard.stripe.com/test/connect/accounts/${stripe_user_id}`
            let live_url = `https://dashboard.stripe.com/connect/accounts/${stripe_user_id}`
            // return callback(null, {
            //     statusCode: 301,
            //     headers: {
            //         location: live_url
            //     },
            //     body: null
            // })
            LambdaHttpResponse('200', {
                stripe_user_id,
                redirect_url: live_url
            }, callback)

        }, (err) => {
            return LambdaHttpResponse('400', err, callback)
        })


        // asynchronously called
    });


}
module.exports.newClientSignedUp = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let err, succ;
    if (event.hasOwnProperty('keep-warm')) {
        console.log('Call is just to warm the lamda function')
        return callback(null, {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: { message: 'warm is done' }
        })
    }
    let { code, state: customerId } = event.queryStringParameters || {};
    let body = JSON.parse(event.body)
    console.log('customerId:', customerId)
    console.log('code:', code)
    console.log('body', body)
    // console.log('event', event)

    var options = {
        method: 'POST',
        url: 'https://connect.stripe.com/oauth/token',
        headers:
        {
            'content-type': 'application/x-www-form-urlencoded'
        },
        form:
        {
            client_secret: process.env.PROD_STRIPE_SK,
            code,
            // code: 'ac_Ft06rIevoLrEnIXA6f31YaBcgQOiMnkK',
            grant_type: 'authorization_code'
        }
    };
    request(options, function (error, response, b) {
        if (error) return LambdaHttpResponse('400', { message: 'stripe api failed', error }, callback)
        b = JSON.parse(b)
        console.log('api body', b.error)
        if (response.statusCode == '200') {
            console.log('success api res', b)

            let {
                stripe_user_id,
                stripe_publishable_key,
                refresh_token,
                access_token
            } = b
            updateStripeAccountId(customerId, {
                stripe_user_id,
                stripe_publishable_key,
                refresh_token,
                access_token
            }).then(() => {
                console.log(body);
                LambdaHttpResponse('200', { status: 'ok' }, callback)
            }, (err) => {
                LambdaHttpResponse('400', { message: 'unable to update the db', err }, callback)
            })
        }
        else {
            LambdaHttpResponse('400', { message: b, err }, callback)
        }

    });
}