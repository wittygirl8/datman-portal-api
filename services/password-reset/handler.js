'use strict';
const async = require('async');
const Joi = require('@hapi/joi');

const smsLib = require('../../library/lib/sms')
const helpers = require('../../library/helpers')
const { sendSms } = require('../../library/lib/sms')
const { sendEmail } = require('../../library/lib/email')

const email = require('../../library/lib/email')
const dbq = require('./dbq');
const gDbq = require('../../database/global-db-queries')
const { custom_logger, errorType } = require("../../library/helpers")


const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

/** * 
 * check the if customer exist with provide phone or email.
 * return the business_details which include parameter like usename, password etc.
 * @param {Object} info 
 * @param {Function} cb 
 */
let checkCustomerExists = (info, cb) => {

    gDbq.isCustomerExists(info).then((business_details) => {

        cb(null, info, business_details)

    }, (err) => {
        cb(err)

    })

}

/**
 * Reset the password once the users phone or email has been verified
 * @param {Object} info 
 * @param {Object} business_details !this function does not uses this object just pases to cb for next function waterfall async.
 * @param {Function} cb 
 */
let doReset = (info, business_details, cb) => {

    dbq.changePassword(info).then((plain_pass) => {
        cb(null, info, business_details, plain_pass)

    }, (err) => {
        cb(err)

    })
}

/**
 * After the genrating successful password communicate the clinet via sms/email
 * @param {Object} info 
 * @param {Object} business_details
 * @param {String} plain_pass 
 * @param {Function} cb 
 */
let communicateClient = (info, business_details, plain_pass, cb) => {
    console.log('hey pease communicate the client')
    // return cb(null, info, plain_pass)

    let { From: phone, email } = info;
    let { customers_email } = business_details
    let emailPromiseObj, smsPromiseObj

    console.log('communicate the clinet', email, customers_email, business_details)
    // if (email || customers_email) {
    //     // emailPromiseObj = sendEmail(info, business_details, plain_pass)
    //     emailPromiseObj = sendEmail(info, business_details, plain_pass)

    // }

    if (phone) {
        smsPromiseObj = sendSms(phone, business_details, plain_pass)

    }

    Promise.all([emailPromiseObj, smsPromiseObj]).then((success) => {
        // Promise.all([emailPromiseObj]).then((success) => {


        custom_logger(errorType.OK, success)
        console.log('success11', success)
        cb(null, info, plain_pass)

    }, (err) => {
        cb(err)

    })

    // sendEmail({ 
    //     "From": "09444841945",
    //     "To": "+441534876163",
    //     "CallSid": "CA04bdfe1270e89d9c8e0eab912f3ab812",
    //     "email": "sandeep@datman.je"

    //   }, { "business_name": "Datman cool pool" }, "hey my pass").then((subxess)=>{
    //       console.log("hey my al",subxess)
    //           cb(null, info, plain_pass)
    //   })

    // })
}


module.exports.resetPassword = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    let body = JSON.parse(event.body)

    async.waterfall([
        /**
         * This function is dummby to pass the callback to next function
         * This is done so so we can have a unit test for each function
         * @param {Fuction} cb 
         */
        function dummy(cb) {

            cb(null, body)
        },

        checkCustomerExists,
        doReset,
        communicateClient

    ], (err, info, plain_pass) => {

        if (err) {

            console.log('seems error', err)
            return callback(null, {
                statusCode: 400,
                body: JSON.stringify(err)
            })

        }
        console.log('Password Reset handler ran sucessfully ')

        callback(null, {
            statusCode: 200,
            body: JSON.stringify({ plain_pass })
        })

    })
};


module.exports.crmResetPassword = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;

    try {

        // requested payload 
        let payload = JSON.parse(event.body)

        // Schema for key validation of the request body
        const schema = Joi.object({
            email: Joi.string(),
            phone: Joi.number()
        }).xor('email', 'phone')

        await schema.validateAsync(payload)

        if (payload.email) {
            params = {
                email: payload.email
            }
            let emails = await dbq.isClientEmailExist(params)

            //new code
            let responses = []
            if (emails.length == 0) {
                let response = {
                    data: emails
                }
                return helpers.LambdaHttpResponse2(400, response, headers)

            } else {
                for (let i = 0; i < emails.length; i++) {
                    let plainPassword = helpers.generatePassword()
                    params = {
                        plainPassword,
                        email: payload.email,
                        business_name: emails[i].dataValues.business_name,
                        id: emails[i].dataValues.id
                    }
                    await dbq.updatePasswordViaEmail(params)
                    let result = await email.sendEmailViaMandrill(params)
                    responses.push(result.messageId)
                    if (i == emails.length - 1) {
                        let response = {
                            data: { message: 'OK', ids: responses }
                        }
                        return helpers.LambdaHttpResponse2(200, response, headers)
                    }
                }

            }
        }

        else if (payload.phone) {

            params = {
                phone: payload.phone
            }

            let phones = await dbq.isClientPhoneExist(params)
            //new code
            let responses = []
            if (phones.length == 0) {
                let response = {
                    data: phones
                }
                return helpers.LambdaHttpResponse2(400, response, headers)
            } 
            else {
                for (let i = 0; i < phones.length; i++) {
                    let plainPassword = helpers.generatePassword()
                    params = {
                        plainPassword,
                        phone: payload.phone,
                        id: phones[i].dataValues.id
                    }
                    await dbq.updatePasswordViaPhone(params)
                    let myresultu = await dbq.updatePasswordViaPhone(params)
                    responses.push(myresultu)
                    await smsLib.sendSms(payload.phone, {}, plainPassword)
                    if (i == phones.length - 1) {
                        let response = {
                            data: { message: 'OK', ids: responses }
                        }
                        return helpers.LambdaHttpResponse2(200, response, headers)
                    }
                }

            }

        }
    }
    catch (e) {
        console.log(e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)

    }
}

module.exports.mypayResetPassword = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    let params;
  
    try {
      // requested payload
      let payload = JSON.parse(event.body);
  
      if (payload.email) {
        params = {
          email: payload.email,
        };
        let emails = await dbq.isClientEmailExist(params);
  
        console.log(emails);
        let responses = [];
        if (emails.length == 0) {
          let response = {
            data: emails,
          };
          return helpers.LambdaHttpResponse2(400, response, headers);
        } else {
          for (let i = 0; i < emails.length; i++) {
            params = {
              plainPassword: payload.password,
              email: payload.email,
              business_name: emails[i].dataValues.business_name,
              id: emails[i].dataValues.id,
            };
            await dbq.updatePasswordViaEmail(params);
            //let result = await email.sendEmailViaMandrill(params);
            //responses.push(result.messageId);
            //if (i == emails.length - 1) {
  
            //}
          }
          let response = {
            data: { message: 'OK' },
          };
          return helpers.LambdaHttpResponse2(200, response, headers);
        }
      }
  
      if (payload.phone) {
        params = {
          phone: payload.phone,
        };
  
        let phones = await dbq.isClientPhoneExist(params);
        //new code
        let responses = [];
        if (phones.length == 0) {
          let response = {
            data: phones,
          };
          return helpers.LambdaHttpResponse2(400, response, headers);
        } else {
          for (let i = 0; i < phones.length; i++) {
            params = {
              plainPassword: payload.password,
              phone: payload.phone,
              id: phones[i].dataValues.id,
            };
            await dbq.updatePasswordViaPhone(params);
            //let myresultu = await dbq.updatePasswordViaPhone(params);
            //responses.push(myresultu);
            //await smsLib.sendSms(payload.phone, {}, plainPassword);
            //if (i == phones.length - 1) {
          }
          let response = {
            data: { message: 'OK' },
          };
          return helpers.LambdaHttpResponse2(200, response, headers);
        }
        //}
      }
    } catch (e) {
      console.log(e);
      return helpers.LambdaHttpResponse2(400, { message: e }, headers);
    }
  };
