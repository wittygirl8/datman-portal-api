const helpers = require("../../../library/helpers");
const dbq = require("../dbq")
const Joi = require("@hapi/joi");
const JoiDate = require('@hapi/joi-date');

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

module.exports.deleteInvoice = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;

    try {

        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
        let merchant_id = authoriserPayload.merchant_id;

        let payload = JSON.parse(event.body);
        const { id } = payload;

        const schema = Joi.object({
            id: Joi.number().required(),
          });

        let ok = await schema.validateAsync(payload);

        invoiceDetails = await dbq.findInvoiceData(payload, merchant_id);


        if (!invoiceDetails) {
            throw { message: `Invoice Id ${id} for given merchant ${merchant_id} not found!` }
        };

        await dbq.deleteInvoiceData(payload, merchant_id);

        let response = {
            success: 'success',
            message: 'Invoice deleted successfully!'
        };

        return helpers.LambdaHttpResponse2(200, response, headers);

    } catch (e) {
        console.log('error', e);
        return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);

    };
};