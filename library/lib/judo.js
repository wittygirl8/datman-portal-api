let request = require("request")
const Joi = require('@hapi/joi');

module.exports.refund = (params) => {
    //Schema for the key validation of the request body
    const schema = Joi.object({
        receiptId: Joi.string().required(),
        amount: Joi.string().required(),
        // currency: Joi.string().required(),
        yourPaymentReference: Joi.string().required()
    })

    return new Promise((resolve, reject) => {

        isSchemaValid = schema.validate(params)
        if (isSchemaValid.hasOwnProperty('error')) {
            reject(isSchemaValid.error)
        }
        var options = {
            method: 'POST',
            url: 'https://gw1.judopay-sandbox.com/transactions/refunds',
            headers:
            {
                authorization: 'Basic MVc1RTFSbVJSeVI1UzdESDo2NTYzZDA3NDUyYzZkZDg4YjY4MTM1ZjViNjFmMjlhYTc0MzU5MDM0NzRhNjBiNDljYmE5ZjgwYTQxYWZlNDMy',
                'content-type': 'application/json',
                'api-version': '5.6'
            },
            body:
            {
                receiptId: params.receiptId,
                judoId: '100177-237',
                amount: params.amount,
                // currency: params.currency,
                currency: "GBP",
                yourPaymentReference: params.yourPaymentReference
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                console.log("error", error)
                return reject(body)
            }
            if (body.result == "Success") {
                console.log('successfully refunded')
                return resolve(body)
            }
            return reject(body)
        });

    })
}