const async = require('async');
const request = require('request')
const dbq = require('./dbq')
const helpers = require('../../library/helpers')

module.exports.FUNCTION_NAME = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    helpers.LambdaHttpResponse('200', {message: "Your template is runnig successfull"}, callback)
}