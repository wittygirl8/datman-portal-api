'use strict';
const dbq = require('./dbq')
const helpers = require('../../library/helpers')

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}
module.exports.createAccountVerificationRequest = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
      let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)  
      let requestStatus = await dbq.createAccountVerificationRequest({
        customer_id: authoriserPayload.merchant_id
      })
        let response = {
            data : {
                "message": "New account verification request has been added successfully"
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch(e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(401, { message: e }, headers)
    }
}
