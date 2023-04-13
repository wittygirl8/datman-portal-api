const helpers = require("../../../library/helpers");
const dbq = require("../dbq")
const Joi = require("@hapi/joi");
const JoiDate = require('@hapi/joi-date');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

module.exports.createInvoice = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {

        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
        let merchant_id = authoriserPayload.merchant_id;

        let payload = JSON.parse(event.body);

        const schema = Joi.object({
            date: Joi.extend(JoiDate).date().format('YYYY-MM-DD').required(),
            description: Joi.string().max(250).required(),
            amount: Joi.number().positive().precision(2).required().max(10000)
          });

        let ok = await schema.validateAsync(payload);

        if(payload.date < new Date().toISOString().split('T')[0]){
            throw {message: 'Please enter valid date!'}
        };

        let params = {
            ...payload,
            merchant_id
        };

        await dbq.addInvoiceData(params);

        let response = {
            success: 'success',
            message: 'New invoice created successfully!'
        };

        return helpers.LambdaHttpResponse2(200, response, headers);

    } catch (e) {
        console.log('Error while creating invoice entry : ',e.message);
        return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);

    }
};