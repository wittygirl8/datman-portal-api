const nodemailer = require('nodemailer');
const {parse} = require("json2csv")

module.exports.sendEmailWithCsvForBalanceReport = async (params) => {
    // let mandrillCrendentials =JSON.parse(process.env.PROD_MANDRIL)
    let transporter = nodemailer.createTransport({
        pool: true,
        host: 'smtp.mandrillapp.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "info@datman.je", // generated ethereal user
            pass: "j8Yp_6lkBEz4Ccy_gEzHxw" // generated ethereal password
        }
    });

    const csvContent = parse(params.data, ["balance_id","customer_id","base","total_before_fees","total_fees","total_after_fees","total_rent","total_charge_backs","total_withdrawn","total_setup_fee","total_balance","total_monthly_profit","entry_date","month","year","business_name","watch_list_status","postcode","client_type"]);

    let message_with_template = await emailTemplate(params.message);

    let info = await transporter.sendMail({
        from: '"Datman" <info@datman.je>', // sender address
        to: params.email, // list of receivers
        subject: params.subject, // Subject line
        html: message_with_template,
        attachments: [
            {
              filename: `${params.month}-${params.year}-balance-report.csv`,
              content: csvContent,
            },
          ],
    });

    transporter.close();
    return info;
};

let emailTemplate = async (message) => {
    return `<html>
            <head>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
            <title>
            Leaflet
            </title>
            <style type="text/css">
            body, div, h1, h2, h3, h4, h5, h6, p, ul, img, td {margin:0px; padding:0px; }
            #footer a:hover {color: #316574;}
            </style>
            </head>
            <body style="margin: 0; padding: 0; background-repeat: no repeat;" bgcolor="#2b2b2b">
            <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="padding: 30px 0;background: #2b2b2b;">
            <tr>
            <td align="center" style="margin: 0; padding: 0;" >
            <!-- HEADER -->
            <table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" align="center" width="600" style="font-family: Helvetica, Arial, sans-serif;">
            <tr>
            <td width="20" height="75"></td>
            <td width="330" height="75"></td>
            <td width="100"></td>
            </tr>
            </table>
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff;">
            <tr><td width="600" height="20" colspan="3"></td></tr>
            <tr>
            <td height="30" colspan="3"><hr style="color: #1d5671; background-color: #53a9c2; height: 2px; border: none;"></td><!-- horizontal line -->
            </tr>
            <tr><td width="600" height="10" colspan="3"></td></tr>
            <tr>
            <td height="30" width="20"></td>
            <td>
            <!-- description -->
        <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;">Dear Sir/Mam,<br /><br /> ${message}<br /><br /> <br /><br /> <br/>Regards,</p>
     <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;"><strong>Datman Ltd</strong><br /><br /></p>
            </td>
            <td width="20"></td>
            </tr>
            <tr><td width="600" height="20" colspan="3"></td></tr>
            </table>
            <!-- FOOTER -->
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff;"><tr height="20"><td></td></tr></table>
            <table id="footer" cellpadding="0" cellspacing="0" border="0" width="600" class="content" style="background: #1d5671; padding: 0 0 15px 0;">
            <tr>
            <td valign="bottom" height="30" style="text-align: center; color: #bcf0ff; font-size: 11px; font-family: Helvetica, Arial, sans-serif;">
               <a href="https://datman.je" style="color: #bcf0ff; text-decoration: none; font: 11px Helvetica, Arial, sans-serif;">datman.je</a>
            </td>
            </tr>
            </table>
            </tr>
            </table>
            </body>
            </html>`;
};