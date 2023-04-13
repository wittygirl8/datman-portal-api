const Joi = require("@hapi/joi");
const helpers = require("../../../library/helpers");
const moment = require('moment-timezone');
const dbq = require("../dbq")
const helperReport = require("../helpers/generate-report-helpers")
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.generateReportBalance = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let payload = JSON.parse(event.body);
    // let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    // let customerId = authoriserPayload.merchant_id;
    let customerId = '123123123';

    const schema = Joi.object({
      email: Joi.string().email().required(),
      month: Joi.number().strict().required(),
      year: Joi.number().strict().required()
    });

    let ok = await schema.validateAsync(payload);

    let params = {
      ...payload,
      customerId
    };

    let exportBalanceReportData = await dbq.fetchBalanceData(params);

    let EmailParams = {
      ...params,
      subject: `Balance report requested by ${payload.email} for merchant - ${customerId}`,
      message: `Your request for report (${payload.month}/${payload.year}) is successfully generated. Please find the attached file in the mail.`,
      data: exportBalanceReportData
    };

    await helperReport.sendEmailWithCsvForBalanceReport(EmailParams);

    await dbq.updateBalanceFetchRequestLog(params);

    return helpers.LambdaHttpResponse2(200, { message: `The report has been sent to the email address '${payload.email}'` }, headers);

  } catch (error) {
    console.log(error.messsage);
    return helpers.LambdaHttpResponse2(400, { message: error.message }, headers)

  }
};