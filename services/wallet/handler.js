const async = require('async');
const request = require('request')
const dbq = require('./dbq')
const gDbq = require('../../database/global-db-queries')
const helpers = require('../../library/helpers')
const encdec = require('../../library/lib/encdec')
const uuidv4 = require('uuid/v4');
const bounce = require('@hapi/bounce')


module.exports.test = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params = {
        first_name: 'muz',
        last_name: 'mil',
        email: 'email@gm.com',
        phone: '1234',
        comments: 'comments'
    }

    try {
        let dataValues = await dbq.registerUser(params)
        console.log("dataValues",dataValues)
        return {
            statusCode: '200',
            headers: {
                'Access-Control-Allow-Origin': '*', // Required for CORS support to work
                'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
            },
            body: JSON.stringify({ status: 'ok' })
        }
    }
    catch (e) {
        console.log('something went wrong', e)

    }


}

module.exports.providerEnroll = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    helpers.LambdaHttpResponse('200', { message: "providerEnroll" }, callback)
}



let providerExists = (reqBody, reqHeaders, urlData, cb) => {
    dbq.getProvider(reqHeaders).then((providerDetails) => {
        console.log('here you go with db details', providerDetails)
        cb(null, reqBody, reqHeaders, urlData, providerDetails)
    }, (err) => {
        cb(err)
    })

}

let registerUser = (reqBody, reqHeaders, urlData, providerDetails, cb) => {
    gDbq.registerUser(reqBody).then((newUserDetails) => {
        console.log('new user has been successfully created', newUserDetails)
        cb(null, reqBody, reqHeaders, urlData, providerDetails, newUserDetails)

    }, (err) => {
        cb(err)
    })
}

let genrateAccountApiKeys = (reqBody, reqHeaders, urlData, providerDetails, newUserDetails, cb) => {

    let partialAccountApiKey = `P${providerDetails.id}T${helpers.getAccountType(reqBody.account_type)}U${newUserDetails.id}R12345`
    // let accountApiKey= encdec.encrypt('secret',value)
    cb(null, reqBody, reqHeaders, urlData, providerDetails, newUserDetails, partialAccountApiKey)
}

let registerAccount = (reqBody, reqHeaders, urlData, providerDetails, newUserDetails, partialAccountApiKey, cb) => {
    let params = {
        client_ref_id: reqBody.client_ref_id,
        partialAccountApiKey,
        user_id: newUserDetails.id,
        provider_id: providerDetails.id,
        account_type: reqBody.account_type,
        balance: '0.00',
        status: 1
    }
    dbq.createAccount(params).then((newAccountDetails) => {
        console.log('new account has been created', newAccountDetails)
        let decrypted_api_key = `A${newAccountDetails.id}${partialAccountApiKey}`
        let api_key = `acct_${encdec.encrypt('secret', decrypted_api_key)}`
        let l_params = {
            partial_api_key: partialAccountApiKey,
            api_key
        }
        dbq.updateAccount(l_params).then((accountDetails) => {
            cb(null, accountDetails)
        }, (err) => {
            console.log('failed while updating a new account for api keys')
            cb(err)
        })

    }, (err) => {
        console.log('failed while creating a new account')
        cb(err)
    })
}

/**
 * function helps in creating new account for individual customer or the stores.
 */

module.exports.accountEnroll = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    // let reqHeaders = {
    //     api_key: 'sec_foodhub124'
    // }

    // let reqBody = {
    //     firstname: 'lol',
    //     lastname: 'man',
    //     email: 'jhon.san.dat@gmail.com',
    //     phone: '07123456789',

    //     client_ref_id: 'someUniqueChar123',
    //     account_type: 'END_USER'
    // }

    let reqHeaders = event.headers
    let reqBody = JSON.parse(event.body)
    let urlData = {}

    console.log("reqBody", reqBody)


    async.waterfall([
        function dummy(cb) {
            cb(null, reqBody, reqHeaders, urlData)
        },
        providerExists,
        registerUser,
        genrateAccountApiKeys,
        registerAccount
    ], (err, newAccountDetails) => {
        if (err) {
            return helpers.LambdaHttpResponse('300', err, callback)
        }
        console.log('newAccountDetails', newAccountDetails)
        helpers.LambdaHttpResponse('200', { status: "ok", account_api_key: `${newAccountDetails.api_key}` }, callback)
    })


}

let proxyOptmanyRequest = () => {
    return new Promise((resolve, reject) => {
        resolve({
            amount: 20,
            currrency: 'GBP',
            account: '4de1cd97-089e-4353-a021-39986e92ed53'
        })
        return
        var options = {
            method: 'POST',
            url: 'https://example.com',
            qs: { id: '11111111' },
            headers:
            {
                'postman-token': '3286785b-242f-0a14-6f88-db38ed5ed659',
                'cache-control': 'no-cache',
                'content-type': 'application/json'
            },
            body: { country: 'au', email: 'for@g.com', business_name: 'f8live' },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                return reject(error)
            }
            return resolve({ mess: 'helll some tem' })

            console.log(body);
        });

    })



}

let updateTransaction = (reqBody, reqHeaders, urlData, providerDetails, cb) => {
    let decryptedData = ""
    if (reqBody.api_key.split('acct_').length == 2) {
        decryptedData = reqBody.api_key.split('acct_')[1]
    }
    else {
        cb({ message: 'unable to split the api with acct_', api_key: reqBody.api_key })
    }

    console.log('check the dec', encdec.decrypt('secret', decryptedData), 'decryptedData', decryptedData)
    let splitInofromDecryptedData = helpers.getSplitApiKeys(encdec.decrypt('secret', decryptedData))

    console.log('splitInofromDecryptedData OBJECT', splitInofromDecryptedData)

    let params = {
        type: 'TOPUP',
        amount: reqBody.amount,
        currency: reqBody.currency,
        account_id: splitInofromDecryptedData.account_id,
        provider_id: splitInofromDecryptedData.provider_id,
        state: 'OK',
        payment_ref: reqBody.card_payment_id,
    }
    dbq.createTransaction(params).then(() => {
        cb(null, reqBody, reqHeaders, urlData)
    })
}

let updateAccountBalance = (reqBody, reqHeaders, urlData, cb) => {
    console.log('lets chcek if we get the right data', reqBody, reqHeaders, urlData)
    let params = {
        api_key: reqBody.api_key,
        amount: reqBody.amount
    }
    dbq.updateAccountBalance(params).then(() => {
        cb(null, reqBody, reqHeaders, urlData)
    }, (err) => {
        cb(err)
    })
}

module.exports.pay = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    let php_api = '' //post
    let urlData = {
        action: 'api',
        // action: 'form'
    }


    if (urlData.action == 'form') {
        proxyOptmanyRequest().then((response) => {
            helpers.LambdaHttpResponse('200', { message: 'quit connection since i do not have the tokenized card' })
        }, (err) => {
            helpers.LambdaHttpResponse('300', err)
        })
    }
    else if (urlData.action == 'api') {
        proxyOptmanyRequest().then((data) => {

            //just for testing --> test start
            let reqHeaders = {
                api_key: 'sec_foodhub124'
            }

            let reqBody = {
                card_payment_id: '1234567', // carpayment table
                api_key: 'acct_5203c8f555f07f3396ec64f9a05528f8083dae877f80478668278147063cd18a',
                amount: '.50',
                currency: 'GBP'
            }
            let urlData = {}
            //just for testing --> test end

            async.waterfall([
                function dummy(cb) {
                    cb(null, reqBody, reqHeaders, urlData)
                },
                providerExists,
                updateTransaction,
                updateAccountBalance
            ], (err) => {
                if (err) {
                    return helpers.LambdaHttpResponse('300', err, callback)
                }
                helpers.LambdaHttpResponse('200', { status: "ok" }, callback)
            })

        })
    }
    else {
        helpers.LambdaHttpResponse('300', { message: 'action is missing in url parameter' })
    }

}

module.exports.refund = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    // check in the card payment table if that order exist then check the value if it more than 
    //create a entry in transaction
    // update the balance same as topup
    // return with some unique ref key

    let reqBody = {
        "account_api_key": "acct_f2421432f38fc74268abf745fa47ea6bc7d4b699e96160a330ac1d154a8920c5",
        "amount": "24.09",
        "order_id": "12345",
        "reason": "Food was not delivered",
        "host": "example.com",
        "merchant_id": "63191212345"
    }
    let recordRefundTransaction = () => {
        let params = {
            type: 'REFUND'
        }
        dbq.createTransaction(params)
    }

    async.waterfall([


    ], (err) => {

    })




    helpers.LambdaHttpResponse('200', { message: "refund" }, callback)
}

module.exports.withdraw = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    helpers.LambdaHttpResponse('200', { message: "withdraw" }, callback)
}



/**
 * wallet registraion for the new customer at provider
 * returns the wallet_id
 * provider need to store and for any futher comunication or transaction wallet_id need to be used
 */

module.exports.walletRegistration = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let headers = (event.headers) 
        let payload = JSON.parse(event.body) 
        let params = {}

        //get the buisness id and type of credentials
        params = {
            accessKey: headers.api_key
        }
        let securityCredential = await dbq.verifySecurityCred(params)

        //check if db queries ran successfully
        if (!securityCredential) {
            let message= 'The provided api key is wrong'
            return helpers.LambdaHttpResponse2(401,
                {
                    status: 'fail',
                    message
                })
        }

        //check if the wallet is already created for the encuser
        params = {
            refId: payload.refrence_id
        }
        console.log('herehere1')
        let walletAlreadyExist = await dbq.isRefExist(params)
        console.log('herehere', walletAlreadyExist)
        //check if db queries ran successfully
        if (walletAlreadyExist) {
            //returns the wallet id
            let message= `The refrence_id already exists and here you go with that id ie ${ walletAlreadyExist.dataValues.id}`
            return helpers.LambdaHttpResponse2(200,
                {
                    satus: "ok",
                    wallet_id: walletAlreadyExist.dataValues.id,
                    message
                }
            )
        }

        //create a new wallet
        interUniqueRefId = `BG${securityCredential.business_group_id}CR${payload.refrence_id}`
        params = {
            fname: payload.fname,
            lname: payload.lname,
            email: payload.email,
            refId: interUniqueRefId,
            businessGroupId: securityCredential.business_group_id
        }
        let newWallet = await dbq.createWallet(params)
        // check if db ran successfully and the wallet is created
        // if (!newWallet.hasOwnProperty('dataValues')) {
            if (!newWallet) {
            // bounce.rethrow('Unable to create the wallet at the moment')
            return helpers.LambdaHttpResponse2(500,
                {
                    status: 'fail',
                    message: 'Unable to create the wallet at the moment'
                }
            )
        }

        // wallet is created and returing the newly created wallet id
        // let ofuscatedWalletid = `B${securityCredential.business_group_id}W${newWallet.dataValues.id}`
        // let salt = 
        return helpers.LambdaHttpResponse2(200, {
            status: 'ok',
            wallet_id: newWallet.dataValues.id
        })
    }
    catch (e) {
        console.log('catched error')
        bounce.rethrow(e)
        return {
            statusCode: '200',
            body: JSON.stringify({ status: 'fail walletRegistration1' })
        }
    }

}

module.exports.topup = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false

    let headers = (event.headers);
    let payload = JSON.parse(event.body);
    let params;

    //get the buisness id and type of credentials
    params = {
        accessKey: headers.api_key
    };

    let securityCredential = await dbq.verifySecurityCred(params)
            //check if db queries ran successfully
            if (!securityCredential) {
                let message= 'The provided api key is wrong'
                return helpers.LambdaHttpResponse2(401,
                    {
                        status: 'fail',
                        message
                    })
            }
    //check if the wallet is already created for the encuser
    params = {
            refId: payload.data.shopper.refrence,
            businessGroupId: securityCredential.business_group_id

        }            
        let walletAlreadyExist = await dbq.isRefExist(params)
        if(walletAlreadyExist) {
            params = {
                type: 'TOPUP',
                amount: payload.data.amount,
                currency: payload.data.currency,
                buisnessGroupId: securityCredential.business_group_id,
                buisnessId: 0,
                state: 'OK',
                internalCardPayment: payload.data.internal_card_payment                
            }
            let transaction = dbq.createTransaction(params)
            console.log('hey the report of transaction', transaction)           
        }

}

