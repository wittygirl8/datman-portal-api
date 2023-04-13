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

module.exports.bankUpdateDemo = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let payload = JSON.parse(event.body);
    await checkCustomerPhone.validateAsync(payload);
    let phone = payload.From;

    let clientInfo = await dbq.checkIfClient({ phone });
    if (!Object.keys(clientInfo).length) {
      return helpers.LambdaHttpResponse2(400, { message: "Unauthorized" });
    }

    const link = getVideoDemoLink();
    let sms_message_content = "Please check this video for more info " + link;
    let sms_response = await sendSms1({
      to: phone,
      from: "DML",
      message: sms_message_content,
    });

    let email_subject = "Bank update demo";
    let clients_firstname = clientInfo[0].dataValues.clients_fname;
    let clients_email = clientInfo[0].dataValues.customers_email;
    let message = `Dear ${clients_firstname}, <p>Please click the below link to see a quick demo on how to update your bank details through your datman account. ${link}`;
    let email_response = await sendEmail({
      to: clients_email,
      subject: email_subject,
      message: message,
    });
    console.log("phone && email response", email_response, sms_response);

    return helpers.LambdaHttpResponse2(200, { success: "success" }, headers);
  } catch (e) {
    console.log(e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

let getVideoDemoLink = () => {
  let videoLink = "https://support.datman.je/portal/en/kb/articles/how-to-change-my-bank-account-details";
  return videoLink;
};
