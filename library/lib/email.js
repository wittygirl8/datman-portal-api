const nodemailer = require('nodemailer');

module.exports.sendEmailViaMandrill = async (params) => {
    let mandrillCrendentials =JSON.parse(process.env.PROD_MANDRIL)
    let transporter = nodemailer.createTransport({
        host: 'smtp.mandrillapp.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: mandrillCrendentials.username, // generated ethereal user
            pass: mandrillCrendentials.password // generated ethereal password
        }
    });

    let info = await transporter.sendMail({
        from: '"Datman" <info@datman.je>', // sender address
        to: params.email, // list of receivers
        subject: 'Password Reset - Datman LTD', // Subject line
        // text: 'Hello world?', // plain text body
        html: `<html>
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
    <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;">Dear Sir,<br /><br /> Your Password has been reset for your ${params.business_name} account on the Datman LTD website and online bank.<br /><br /> The details of your new password can be found below.<br /><br />Takeaway Name: ${params.business_name} <br /> Your Username: ${params.email} <br />New password : ${params.plainPassword}<br /><br />You can login using the link <a href="https://datmancrm.com/login.php" target="blank" />datmancrm.com</a><br /> <br/>Yours faithfully, For and on behalf of,</p>
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
        </html>`
    });

    return info

}

module.exports.sendEmail = async (params) => {
    let transporter = nodemailer.createTransport({
        host: 'smtp.mandrillapp.com',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'info@datman.je', // generated ethereal user
            pass: 'j8Yp_6lkBEz4Ccy_gEzHxw' // generated ethereal password
        }
    });
    let message_with_template = emailTemplate(params.message)
    let info = await transporter.sendMail({
        from: '"Datman" <info@datman.je>', // sender address
        to: params.email, // list of receivers
        subject: params.subject, // Subject line
        html: message_with_template
    });

    return info

}


let emailTemplate = (message) => {
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
                                  <td width="330" height="75">
                                  <!--<img src="https://datmancrm.com/images/logo-website.png" width="150"> -->
                                   <h2 style="color:#1d5671;">Datman</h2>
                                    </h2>
                                  </td>
                                  <td width="150">

                                  </td>
                                  <td width="100">
                                  
                                  </td>
                             </tr>
                             </table>



                             <table cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff;">
                                  <tr><td width="600" height="20" colspan="3"></td></tr>
                                 
                                  <tr><td width="600" height="10" colspan="3"></td></tr>
                                  <tr>
                                       <td height="30" width="20"></td>
                                       <td>
                                            <!-- description -->
                                            <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;">
                                                 <br />
                                                 ${message} <br/><br/>
                                                 Email:&nbsp;&nbsp;<b><a href="info@datman.je">info@datman.je</a></b><br /><br />
                                                 <b>Best Regards,</b><br />
                                                 <b>Datman Ltd</b><br /><br />
                                            </p>
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
                                               <a href="https://www.datman.je" style="color: #bcf0ff; text-decoration: none; font: 11px Helvetica, Arial, sans-serif;">www.datman.je</a>
                                       </td>
                                  </tr>
                             </table>
                        </tr>
                   </table>
              </body>
              </html>`;
}

module.exports.sendEmail1 = async (params) => {
     
     try {
          let transporter = nodemailer.createTransport({
          host: "smtp.mandrillapp.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
               user: "info@datman.je", // generated ethereal user
               pass: "j8Yp_6lkBEz4Ccy_gEzHxw" // generated ethereal password
          }
          });

          let message_with_template = emailTemplate(params.message);

          let info = await transporter.sendMail({
          from: params.from, // sender address
          to: params.to, // list of receivers
          subject: params.subject, // Subject line
          html: message_with_template
          });

          return true;
     } catch (error) {
          console.log('email notification failed',error.message);
          return false;
     }
     
};
   
// let info = {
//     From : "",
//     email: "sandeep@datman.je"
// }

// let business_details = {
//     business_name : "buntybu povt",
//     customers_email: "sandeep@datman.je"
// }

// sendEmail(info, business_details, "passsssss").then((s)=>{
//     console.log("s :",s)
// }, (e)=>{
//     console.log("e:", e)
// })

/* const AWS = require('aws-sdk');
const request = require("request"); */
/**
 * Sends the email using AWS SES api
 * @param {Object} info
 * @param {Object} business_details
 * @param {string} pass
 */
// module.exports.sendEmail = (info, business_details, pass) => {
//     // let sendEmail = (info, business_details, pass) => {
//     // let { From: phone, email } = info;
//     let { business_name, customers_email } = business_details

//     let params = {
//         Destination: {
//             ToAddresses: [
//                 /** !HARD CODED FOR TEST PURPOSE UNTILL WE GET THE LIVE DB */
//                 // email
//                 // 'sandeep@datman.je'
//                 customers_email
//             ]
//         },
//         Message: {
//             Body: {
//                 Html: {
//                     Charset: "UTF-8",
//                     Data: `
//                     <html>
//                     <head>
//                     <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
//                     <title>
//                     Leaflet
//                     </title>
//                     <style type="text/css">
//                     body, div, h1, h2, h3, h4, h5, h6, p, ul, img, td {margin:0px; padding:0px; }
//                     #footer a:hover {color: #316574;}
//                     </style>
//                     </head>
//                     <body style="margin: 0; padding: 0; background-repeat: no repeat;" bgcolor="#2b2b2b">
//                     <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="padding: 30px 0;background: #2b2b2b;">
//                     <tr>
//                     <td align="center" style="margin: 0; padding: 0;" >
//                     <!-- HEADER -->
//                     <table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" align="center" width="600" style="font-family: Helvetica, Arial, sans-serif;">
//                     <tr>
//                     <td width="20" height="75"></td>
//                     <td width="330" height="75"></td>
//                     <td width="100"></td>
//                     </tr>
//                     </table>
//                     <table cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff;">
//                     <tr><td width="600" height="20" colspan="3"></td></tr>
//                     <tr>
//                     <td height="30" colspan="3"><hr style="color: #1d5671; background-color: #53a9c2; height: 2px; border: none;"></td><!-- horizontal line -->
//                     </tr>
//                     <tr><td width="600" height="10" colspan="3"></td></tr>
//                     <tr>
//                     <td height="30" width="20"></td>
//                     <td>
//                     <!-- description -->
//                 <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;">Dear Sir,<br /><br /> Your Password has been reset for your ${params.business_name} account on the Datman LTD website and online bank.<br /><br /> The details of your new password can be found below.<br /><br />Takeaway Name: ${params.business_name} <br /> Your Username: ${params.email} <br />New password : ${params.plainPassword}<br /><br />You can login using the link <a href="https://datmancrm.com/login.php" target="blank" />datmancrm.com</a><br /> <br/>Yours faithfully, For and on behalf of,</p>
//              <p style="font: 13px Helvetica, Arial, sans-serif; line-height: 20px;"><strong>Datman Ltd</strong><br /><br /></p>
//                     </td>
//                     <td width="20"></td>
//                     </tr>
//                     <tr><td width="600" height="20" colspan="3"></td></tr>
//                     </table>
//                     <!-- FOOTER -->
//                     <table cellpadding="0" cellspacing="0" border="0" width="600" style="background: #ffffff;"><tr height="20"><td></td></tr></table>
//                     <table id="footer" cellpadding="0" cellspacing="0" border="0" width="600" class="content" style="background: #1d5671; padding: 0 0 15px 0;">
//                     <tr>
//                     <td valign="bottom" height="30" style="text-align: center; color: #bcf0ff; font-size: 11px; font-family: Helvetica, Arial, sans-serif;">
//                        <a href="https://datman.je" style="color: #bcf0ff; text-decoration: none; font: 11px Helvetica, Arial, sans-serif;">datman.je</a>
//                     </td>
//                     </tr>
//                     </table>
//                     </tr>
//                     </table>
//                     </body>
//                     </html>`
//                 }
//             },
//             Subject: {
//                 Charset: 'UTF-8',
//                 Data: "Password Reset - Datman LTD"
//             }
//         },
//         Source: 'info@datman.je', /* required */
//     };

//     return new Promise((resolve, reject) => {

//         let awsParams = JSON.parse(process.env.AWS_SES_CRED)
//         let sendPromise = new AWS.SES(awsParams).sendEmail(params).promise();

//         sendPromise.then(
//             (data) => {
//                 console.log(data.MessageId);
//                 resolve()

//             }).catch(

//                 (err) => {
//                     console.error(err, err.stack);
//                     reject()

//                 });

//     })
// }