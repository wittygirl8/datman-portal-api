"use strict";
const dbq = require("../dbq");
const helpers = require("../../../library/helpers");
const { sendSms1 } = require("../../../library/lib/sms");
const { sendEmail } = require("../../../library/lib/email");
const { checkCustomerPhone } = require("../../../library/helpers/schema");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.resetPasswordIvr = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    let payload = JSON.parse(event.body);
    await checkCustomerPhone.validateAsync(payload);
    const clientInfo = await dbq.checkIfClient({
      phone: payload.From,
    });
    if (!Object.keys(clientInfo).length) {
      return helpers.LambdaHttpResponse2(
        400,
        { message: "Unauthorized" },
        headers
      );
    }
    const link = getPasswordResetLink();
    for (let client of clientInfo) {
      let sms_message_content = `Please click on the below link to reset the password. ${link}.`;
      let sms_response = await sendSms1({
        phone: client.customers_mobile,
        from: "DML",
        message: sms_message_content,
      });
      let email_subject = "Datman - Reset Password";
      let clients_firstname = clientInfo[0].dataValues.clients_fname;
      let clients_email = clientInfo[0].dataValues.customers_email;
      let message = `Dear ${clients_firstname}, <p> Please click on the below link to reset the password. ${link}.</p>`;

      let email_response = await sendEmail({
        to: clients_email,
        subject: email_subject,
        message: message,
      });
      console.log("email && sms response", email_response, sms_response);
    }
    return helpers.LambdaHttpResponse2(200, { success: "success" }, headers);
  } catch (e) {
    console.log(e);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};

const getPasswordResetLink = () => {
  let link = "https://beta-portal.omni-pay.com/forgot-password";
  return link;
};
