const AWS = require('aws-sdk');
const { v4: uuidv4 } = require("uuid");

module.exports.sendEmail = async (template, params) => {

    const sqs = new AWS.SQS({});

    let message_with_template = params.message;
    if (template === 'OMNIPAY') {
        message_with_template = emailTemplate(params.message);
    }

   var recipient_email_address = true ? params.email : process.env.SIMULATOR_SUCCESS;
    console.log(`To Email id: ${recipient_email_address}`);

    var payload = {
        type: 'Basic',
        subject: params.subject,
        html_body: message_with_template,
        cc_address: [],
        to_address: [recipient_email_address],
        source_email: params.from ? params.from : '"Omnipay" <no-reply@omni-pay.com>',
        reply_to_address: []
    };

    const email_objectStringified = JSON.stringify({
        payload
    });

    const email_params = {
        MessageGroupId: uuidv4(),
        MessageBody: email_objectStringified,
        QueueUrl: process.env.EMAIL_QUEUE_URL
    };

    try {
        let info = await sqs.sendMessage(email_params).promise();
        console.log({info});
        return info;
    } catch (e) {
        console.log("Error ", e);
        return { error_message: 'Email Notification failed!' };
    }

};

const emailTemplate = (message) => {
    return `
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<!-- <a href="https://ibb.co/qpgLcTT"><img src="https://i.ibb.co/dDpsV88/undraw-Yacht-8g6r.png" alt="undraw-Yacht-8g6r" border="0"></a> -->
<!-- <div style="background-image: url('https://i.ibb.co/dDpsV88/undraw-Yacht-8g6r.png');">  -->

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title></title>
  <style type="text/css" rel="stylesheet" media="all">
  /* Base ------------------------------ */

  @import url("https://fonts.googleapis.com/css?family=Nunito+Sans:400,700&display=swap");
  body {
    width: 100% !important;
    height: 100%;
    margin: 0;
    -webkit-text-size-adjust: none;
  }

  a {
    color: #3869D4;
  }

  a img {
    border: none;
  }

  td {
    word-break: break-word;
  }

  .preheader {
    display: none !important;
    visibility: hidden;
    mso-hide: all;
    font-size: 1px;
    line-height: 1px;
    max-height: 0;
    max-width: 0;
    opacity: 0;
    overflow: hidden;
  }
  /* Type ------------------------------ */

  body,
  td,
  th {
    font-family: "Nunito Sans", Helvetica, Arial, sans-serif;
  }

  h1 {
    margin-top: 0;
    color: #333333;
    font-size: 22px;
    font-weight: bold;
    text-align: left;
  }

  h2 {
    margin-top: 0;
    color: #333333;
    font-size: 16px;
    font-weight: bold;
    text-align: left;
  }

  h3 {
    margin-top: 0;
    color: #333333;
    font-size: 14px;
    font-weight: bold;
    text-align: left;
  }

  td,
  th {
    font-size: 16px;
  }

  p,
  ul,
  ol,
  blockquote {
    margin: .4em 0 1.1875em;
    font-size: 16px;
    line-height: 1.625;
  }

  p.sub {
    font-size: 13px;
  }
  /* Utilities ------------------------------ */

  .align-right {
    text-align: right;
  }

  .align-left {
    text-align: left;
  }

  .align-center {
    text-align: center;
  }
  /* Buttons ------------------------------ */

  .button {
    background-color: #3869D4;
    border-top: 10px solid #3869D4;
    border-right: 18px solid #3869D4;
    border-bottom: 10px solid #3869D4;
    border-left: 18px solid #3869D4;
    display: inline-block;
    color: #FFF;
    text-decoration: none;
    border-radius: 3px;
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.16);
    -webkit-text-size-adjust: none;
    box-sizing: border-box;
  }

  .button--green {
    background-color: #22BC66;
    border-top: 10px solid #22BC66;
    border-right: 18px solid #22BC66;
    border-bottom: 10px solid #22BC66;
    border-left: 18px solid #22BC66;
  }

  .button--red {
    background-color: #FF6136;
    border-top: 10px solid #FF6136;
    border-right: 18px solid #FF6136;
    border-bottom: 10px solid #FF6136;
    border-left: 18px solid #FF6136;
  }

  @media only screen and (max-width: 500px) {
    .button {
      width: 100% !important;
      text-align: center !important;
    }
  }
  /* Attribute list ------------------------------ */

  .attributes {
    margin: 0 0 21px;
  }

  .attributes_content {
    background-color: #F4F4F7;
    padding: 16px;
  }

  .attributes_item {
    padding: 0;
  }
  /* Related Items ------------------------------ */

  .related {
    width: 100%;
    margin: 0;
    padding: 25px 0 0 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
  }

  .related_item {
    padding: 10px 0;
    color: #CBCCCF;
    font-size: 15px;
    line-height: 18px;
  }

  .related_item-title {
    display: block;
    margin: .5em 0 0;
  }

  .related_item-thumb {
    display: block;
    padding-bottom: 10px;
  }

  .related_heading {
    border-top: 1px solid #CBCCCF;
    text-align: center;
    padding: 25px 0 10px;
  }
  /* Discount Code ------------------------------ */

  .discount {
    width: 100%;
    margin: 0;
    padding: 24px;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    background-color: #F4F4F7;
    border: 2px dashed #CBCCCF;
  }

  .discount_heading {
    text-align: center;
  }

  .discount_body {
    text-align: center;
    font-size: 15px;
  }
  /* Social Icons ------------------------------ */

  .social {
    width: auto;
  }

  .social td {
    padding: 0;
    width: auto;
  }

  .social_icon {
    height: 20px;
    margin: 0 8px 10px 8px;
    padding: 0;
  }
  /* Data table ------------------------------ */

  .purchase {
    width: 100%;
    margin: 0;
    padding: 35px 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
  }

  .purchase_content {
    width: 100%;
    margin: 0;
    padding: 25px 0 0 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
  }

  .purchase_item {
    padding: 10px 0;
    color: #51545E;
    font-size: 15px;
    line-height: 18px;
  }

  .purchase_heading {
    padding-bottom: 8px;
    border-bottom: 1px solid #EAEAEC;
  }

  .purchase_heading p {
    margin: 0;
    color: #85878E;
    font-size: 12px;
  }

  .purchase_footer {
    padding-top: 15px;
    border-top: 1px solid #EAEAEC;
  }

  .purchase_total {
    margin: 0;
    text-align: right;
    font-weight: bold;
    color: #333333;
  }

  .purchase_total--label {
    padding: 0 15px 0 0;
  }

  body {
    background-color: #F4F4F;
    color: #51545E;
  }

  p {
    color: #51545E;
  }

  p.sub {
    color: #6B6E76;
  }

  .email-wrapper {
    width: 100%;
    margin: 0;
    padding: 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    background-color: #F4F4F7;
  }

  .email-content {
    width: 100%;
    margin: 0;
    padding: 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
  }
  /* Masthead ----------------------- */

  .email-masthead {
    padding: 60px 0;
    text-align: center;
  }
  .email-masthead-footer {
    padding: 20px 0;
    text-align: center;
  }

  .email-masthead_logo {
    width: 94px;
  }

  .email-masthead_name {
    font-size: 16px;
    font-weight: bold;
    color: #A8AAAF;
    text-decoration: none;
    text-shadow: 0 1px 0 white;
  }
  /* Body ------------------------------ */

  .email-body {
    width: 100%;
    margin: 0;
    padding: 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    background-color: #FFFFFF;
  }

  .email-body_inner {
    width: 570px;
    margin: 0 auto;
    padding: 0;
    -premailer-width: 570px;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    background-color: #FFFFFF;
  }

  .email-footer {
    width: 570px;
    margin: 0 auto;
    padding: 0;
    -premailer-width: 570px;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    text-align: center;
    background-color: #128CCB;
    /* color: white; */
  }

  .email-footer p {
    color: #6B6E76;
  }

  .body-action {
    width: 100%;
    margin: 30px auto;
    padding: 0;
    -premailer-width: 100%;
    -premailer-cellpadding: 0;
    -premailer-cellspacing: 0;
    text-align: center;
  }

  .body-sub {
    margin-top: 25px;
    padding-top: 25px;
    border-top: 1px solid #EAEAEC;
  }

  .content-cell {
    padding: 35px;

  }
  /*Media Queries ------------------------------ */

  @media only screen and (max-width: 600px) {
    .email-body_inner,
    .email-footer {
      width: 100% !important;

    }
  }

  @media (prefers-color-scheme: dark) {
    body,
    .email-body,
    .email-body_inner,
    .email-content,
    .email-wrapper,
    .email-masthead,
    .email-footer {
      background-color: #333333 !important;
      color: #FFF !important;
    }
    p,
    ul,
    ol,
    blockquote,
    h1,
    h2,
    h3 {
      color: #FFF !important;
    }
    .attributes_content,
    .discount {
      background-color: #222 !important;
    }
    .email-masthead_name {
      text-shadow: none !important;
    }
  }

  :root {
    color-scheme: light dark;
    supported-color-schemes: light dark;
  }
  </style>
  <!--[if mso]>
  <style type="text/css">
    .f-fallback  {
      font-family: Arial, sans-serif;
    }
  </style>
<![endif]-->
</head>
<body>
  <!-- <span class="preheader">This is a receipt for your recent purchase on {{ purchase_date }}. No payment is due with this receipt.</span> -->
  <table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center">
        <table  class="email-content" width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td class="email-masthead">
              <a href="https://example.com" class="f-fallback email-masthead_name">
              <!-- [Product Name] -->
              <a href="https://portal.omni-pay.com" target="_blank"><img style="width: 120px; height: auto;"  src="https://logos-general.s3-eu-west-1.amazonaws.com/resellers-logos/omni-pay.png" border="0"></a>
            </a>
            </td>
          </tr>
          <!-- Email Body -->
          <tr>
            <td class="email-body" width="100%" cellpadding="0" cellspacing="0">
              <table class="email-body_inner" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                <!-- Body content -->
                <tr>
                  <td class="content-cell">
                    <div class="f-fallback">
                      ${message}
                      <br>
                      <br>
                      <br>
                      <p style="font-size: 15px; color: rgba(0, 0, 0, 0.664);">If you have any questions about this payment please reach out to us on wecare@omni-pay.com.</p>
                      <p>Cheers,
                        <br>Omnipay Team</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-masthead-footer">
              <p class="f-fallback sub align-center">
                      <a href="https://omni-pay.com" target="_blank"> omni-pay.com </a>
                      <br>Innovation Way, Stoke-on-Trent ST6 4BF, United Kingdom
              </p>
              <p  style="font-size: 10px;" class="f-fallback sub align-center">&copy; 2022  <a href="https://omni-pay.com" target="_new">Omnipay</a> . All rights reserved.</p>
            </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};