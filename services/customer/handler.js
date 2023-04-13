'use strict';
const Joi = require('@hapi/joi');
const dbq = require('./dbq')
const helpers = require('../../library/helpers')
const s3 = require('../../library/lib/s3')
const gDbq = require('../../database/global-db-queries')
const accountValidation = require('../../library/lib/account_number_validation')
const {sendEmail} = require('../../library/lib/email')
const crypto = require('crypto');
var moment = require('moment');
const { auditLogsPublisher } = require("../../library/lib/audit-log-publisher");
const { getUserId } = require("../auths/handler");

const MAX_UPLOAD_LINKS = 10

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

module.exports.validateBankDetails = async (event, context, callback) => {
    
    context.callbackWaitsForEmptyEventLoop = false
    try {
        let payload = JSON.parse(event.body)
        //payload validation
        const schema = Joi.object({
            "merchant_id": Joi.number().required(),
            "feature_name": Joi.string().valid('new_bank_update', 'registration_bank_update').required(),
            "feature_reference_id": Joi.number().required(),
            "account_number": Joi.string().length(8).pattern(/^[0-9]+$/).required(),
            "sortcode": Joi.string().length(6).pattern(/^[0-9]+$/).required()
        });
        payload = await schema.validateAsync(payload);
        
        //we dont have jwt authentication for this function, as this lambda will be called from php crm aswell (registration page)
        //hence need to have couple of validation check agains the payload
        //should validate feature_reference_id based on feature_name, and get the merchant_id
        //this check ensures api being called with only valid reference ids
        let merchant_id = await getMerchantIdForBankValidation({
            feature_name : payload.feature_name,
            feature_reference_id : payload.feature_reference_id,
        })
        //cross check the merchant_id with the one been passed through the payload
        //this one act as kind of authentication, as we dont have any kind of other authentication in place
        //this check makes outsiders difficult to mis-use this function 
        if(!merchant_id || merchant_id !== payload.merchant_id){
            throw({message: "Merchant could not be found!"});
        }

        //check if merchant exists with customers table, additional check before reaching the 3rd party (very expensive) validation api
        let customerInfo = await dbq.fetchAddress(merchant_id)
        if(!customerInfo){
            throw({message: "Merchant does not exists!"});
        }
        
        //calling 3rd party api to check bank details
        let bankDetailsResponse = await accountValidation.validateBankDetails({
            sortcode: payload.sortcode,
            account_number: payload.account_number
        },"live"); //change the 2nd parameter to 'live' in production mode

        //creating sql transaction
        const sqlTransaction = await dbq.createTransaction();
        
        //populating validation log table
        let validation_status = bankDetailsResponse.hasOwnProperty("IsCorrect") ? bankDetailsResponse.IsCorrect ? "VALID" : "INVALID" : 'API-FAILED'
        let BankValidationLog = await dbq.createBankValidationLog({
            customer_id: merchant_id,
            feature_name: payload.feature_name,
            feature_reference_id: payload.feature_reference_id,
            account_number: payload.account_number,
            sortcode: payload.sortcode,
            validation_status,
            api_response: JSON.stringify(bankDetailsResponse)
        },{
            transaction: sqlTransaction
        })

        if(validation_status === 'INVALID'){
            //send an email & link to customer informing him regarding the validation failure and asking him to update the details once again
            //populating key based on the log created
            let api_key = crypto.createHash('md5').update(`${BankValidationLog.dataValues.id}`.toString()).digest("hex")
            await dbq.createBankValidationKey({
                api_key,
                validation_log_id: BankValidationLog.dataValues.id,
                customer_id: merchant_id,
                status: 'ACTIVE'
            },{
                transaction: sqlTransaction
            })
            //commtting transaction
            await dbq.commitTransaction(sqlTransaction);

            //sending email notification
            let email_subject = "Datman - New Bank Details Error"
            let email_body = `Hi ${customerInfo.clients_fname}, 
            <p>Thank you for signing up for Datman. Unfortunately, the bank details you submitted while registering for your Datman account were found to be incorrect after being validated.</p>
            <p>We kindly ask you to log in to your online Datman from the below link and provide us with the correct banking details to avoid any complications while receiving your withdrawals.<p>
            <br>
            https://portal.datmancrm.com/bank-update/${api_key}`;
            let email_params = {
                email: customerInfo.customers_email,
                subject: email_subject,
                message: email_body
            }
            console.log('email_params',email_params)
            let email_response = await sendEmail(email_params)
            console.log('email_response',email_response)

        }else if(validation_status === 'VALID'){
            //committing transaction
            //update bank_confirmation table as validated
            if(payload.feature_name === 'new_bank_update'){
                await dbq.updateBankConfirmation({
                    values: { 
                        bank_details : 'true'
                    },
                    condition: {
                        id: payload.feature_reference_id
                    }
                })
            }
            await dbq.commitTransaction(sqlTransaction);
        }
        
        
        let response = {
            data: {
                message: validation_status
            }
        }
        
        return helpers.LambdaHttpResponse2(200, response, headers)

    }catch (e) {
        return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
    }
}

module.exports.validateBankUpdateKey = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    try {

        let payload = JSON.parse(event.body)
        //payload validation
        const schema = Joi.object({
            "api_key": Joi.string().required()
        });
        payload = await schema.validateAsync(payload);

        //validating api key
        let keyStatus = await validateBankUpdateKey({
            api_key : payload.api_key
        })

        if(!keyStatus){
            throw({message: "Invalid key!"});
        }
        
        //key found
        let response = {
            data: {
                message: "success"
            }
        }
        
        return helpers.LambdaHttpResponse2(200, response, headers)

    }catch (e) {
        return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
    }
}

module.exports.updateBankDetailsAttempt = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    try {

        let payload = JSON.parse(event.body)
        //payload validation
        const schema = Joi.object({
            "api_key": Joi.string().required(),
            "sortcode": Joi.string().length(6).pattern(/^[0-9]+$/).required(),
            "confirm_sortcode": Joi.any().valid(Joi.ref('sortcode')).required(),
            "accountnumber": Joi.string().length(8).pattern(/^[0-9]+$/).required(),
            "confirm_accountnumber": Joi.any().valid(Joi.ref('accountnumber')).required(),
            "account_holder": Joi.string().required(),
            "bank_name": Joi.string().required()
        });
        payload = await schema.validateAsync(payload);

        //check api_key validation
        let keyInfo = await validateBankUpdateKey({
            api_key : payload.api_key
        })

        if(!keyInfo){
            throw({message: "Invalid key!"});
        }

        //update new Bank details with their respective features
        await updateNewBankDetails({
            keyInfo,payload
        })

        let response = {
            data: {
                message: "successfully updated"
            }
        }
        
        return helpers.LambdaHttpResponse2(200, response, headers)

    }catch (e) {
        return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
    }
}

module.exports.updateCustomerAddress = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        const schema = Joi.object({
            "business_name": Joi.string(),
            "business_number": Joi.string(),
            "business_street": Joi.string(),
            "business_city": Joi.string(),
            "business_county": Joi.string(),
            "business_post_code": Joi.string(),
            "business_phone_number": Joi.number(),
            "business_email": Joi.string().email(),
            "clients_fname": Joi.string(),
            "clients_sname": Joi.string(),
            "customers_number": Joi.string(),
            "customers_street": Joi.string(),
            "customers_city": Joi.string(),
            "customers_county": Joi.string(),
            "customers_post_code": Joi.string(),
            "customers_mobile": Joi.number(),
            "customers_email": Joi.string().email(),
            "account_verification_status": Joi.string()
        });
        let ok = await schema.validateAsync(payload);
        let payment = await dbq.updateAddress(payload, authoriserPayload.merchant_id)
        console.log(payment);
        let response = {
            data: {
                message: "Updated successfully"
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }

    catch (e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.fetchCustomerAddress = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let addressValues = await dbq.fetchAddress(authoriserPayload.merchant_id)
        let bankValues = await dbq.fetchBankDetails(authoriserPayload.merchant_id)

        //mask bank info before senting out
        bankValues.accountnumber = helpers.maskWithStar(bankValues.accountnumber);
        bankValues.sortcode = helpers.maskWithStar(bankValues.sortcode);

        let response = {
            data: {
                addressValues, bankValues
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)
    }

    catch (e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.updateCustomerPassword = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        const schema = Joi.object({
            "current_password": Joi.string(),
            "password": Joi.string(),
            "password_confirm": Joi.string()
        });

        let ok = await schema.validateAsync(payload);

        //check if the old password provided is correct
        let current_password_status = await dbq.checkPassword(payload.current_password, authoriserPayload.merchant_id)
        if (!current_password_status) {
            return helpers.LambdaHttpResponse2(420, { error: 'The current password is wrong' }, headers)
        }

        //check if the new password and confirmed one are same
        if (payload.password != payload.password_confirm) {
            return helpers.LambdaHttpResponse2(421, { error: 'Password mismatch' }, headers)
        }


        //update the new password
        await dbq.updatePassword(payload.password, authoriserPayload.merchant_id)

        let response = {
            data: {
                message: "Password has been updated successfully"
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }

    catch (e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.updateCustomerBankDetails = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let schema,response;
        switch(payload.action) {
            case 'create':
                schema =Joi.object({
                    "action": Joi.string().required(),
                    "account_holder":Joi.string().required(),
                    // "bank_name":Joi.string(),
                    "confirm_new_account_number":Joi.number().required(),
                    "confirm_new_sortcode":Joi.number().required(),
                    "existing_account_number":Joi.number().required(),
                    "existing_sortcode":Joi.number().required(),
                    "new_account_number":Joi.number().required(),
                    "new_sortcode":Joi.number().required()
                });
        
                let ok = await schema.validateAsync(payload);
                 
                payload.bank_details = 'false'; //the below validation takes over
                
                let payment = await dbq.updateBankDetails(payload,authoriserPayload.merchant_id)
                
                response = {
                    data:{
                        message:"Updated successfully",
                        bank_confirmation_id: payment.dataValues.id,
                        merchant_id: authoriserPayload.merchant_id,
                    }
                }
                return helpers.LambdaHttpResponse2(200, response, headers)
            break;
            
            case 'update':
                //here we update the bank_confirmation table entry status from PENDING to AWAIT PROCESSING
                schema =Joi.object({
                    "action": Joi.string().required(),
                    "bank_confirmation_id":Joi.number().required()
                });
                let validation_ok = await schema.validateAsync(payload);

                /**
                 * only for new bank update. 
                 * PENDING - 1st stage when we update the new  bank details
                 * AWAITING PROCESSING - When cutomer upload the docs 
                 * SUCCESS - When admin verify -- all ok
                 * FAILED - When admin rejects
                 */
                let bank_update_resonse = await dbq.updateBankConfirmation({
                    values: { 
                        status :'AWAITING PROCESSING'
                    },
                    condition: {
                        id: payload.bank_confirmation_id
                    }
                })

                response = {
                    data:{
                        message:"Bank status Updated successfully"
                    }
                }
                return helpers.LambdaHttpResponse2(200, response, headers)
            break;
        }
        

    }

    catch(e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.uploadDocuments = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;
    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let merchantId = authoriserPayload.merchant_id
        

        /**
         * request validations
         */

        const schema = Joi.object({
            // file_names: Joi.array().required(),
            request_links_count: Joi.number().integer().max(MAX_UPLOAD_LINKS).required(),
            tag: Joi.string().required()
        })
        await schema.validateAsync(payload)
        let tag = payload.tag
        let requestLinksCount = payload.request_links_count
        let isTagValid = s3.isFileTagValid(tag)

        if (!isTagValid) {
            let message = "In a list provide tag is not valid"
            console.log(message)
            let response = {
                status: "FAIL",
                message
            }
            return helpers.LambdaHttpResponse2(400, response, headers)
        }

        let urls=[]
        for(let i=0; i < requestLinksCount; i++) {
            let url = s3.getSignedUrl(merchantId, tag, 'putObject')
            urls.push(url)
        }

        let response = {
            data: urls
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }

    catch (e) {
        console.log('CRASHED uploadDocuments', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.getDocuments = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;

    try {
        let payload = JSON.parse(event.body)
        // let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        // let merchantId = authoriserPayload.merchant_id


        /**
         * request validations
         */

        const schema = Joi.object({
            //  file_names: Joi.array().required()
            tag: Joi.string().required(),
            h_merchant_id: Joi.string().required(),

        })
        let ok = await schema.validateAsync(payload)
        let tag = payload.tag
        let merchantId = payload.h_merchant_id
        // let isfileNamesValid = payload.file_names.every(el => { return s3.isFileKeyValid(el) })
        let isTagValid = s3.isFileTagValid(tag)
        if (!isTagValid) {
            let message = "In a list provide tag is not valid"
            console.log(message)
            let response = {
                status: "FAIL",
                message
            }
            return helpers.LambdaHttpResponse2(400, response, headers)
        }
        let filesKey = await s3.listKeys(merchantId, tag)
        if (filesKey.length < 1) {
            let message = "No files for requested clients"
            let response = {
                status: "FAIL",
                message
            }
            return helpers.LambdaHttpResponse2(400, response, headers)
        }

        console.log('filesKey', filesKey)
        let urls = []
         filesKey.map((el,i) => {
            let url = s3.getSignedUrl(merchantId, el.Key, 'getObject')
            urls.push(url)
        })

        let response = {
            status: "OK",
            data: urls
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }

    catch (e) {
        console.log('CRASHED getDocuments', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.customerConfig = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;

    try {
        //let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        params = {
            customerId: authoriserPayload.merchant_id
        }

        let customerDetails = await gDbq.getCustomerDetails(params)
        let otherDetails = await gDbq.getOtherCustomerDetails(params)
        let annoucementInfo = await gDbq.getAnnouncements(params)

        //fetching information of withdrawl
        let isFirstwithdrawl  = await gDbq.firstWithdrawl(params)
        
        let data = {
            account_verification_status: customerDetails.account_verification_status,
            internal_transfer_status: customerDetails.internal_transfer_status,
            country_id: customerDetails.country_id,

            ddlBusinessType: otherDetails.ddlBusinessType,
            bankaccount: otherDetails.accountnumber.substr(otherDetails.accountnumber.length - 4),
            sortcode: otherDetails.sortcode.substr(otherDetails.sortcode.length - 3),
            announcement : (annoucementInfo.length) ? annoucementInfo[0] : {message: ''},
            isFirstwithdrawl : isFirstwithdrawl.length>=1 ? false : true,
            autoWithdraw : customerDetails.auto_withdraw
        }    
        
        let response = {
            data
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }

    catch(e) {
        console.log('CRASHED customerConfig', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

let validateBankUpdateKey = async (params) => {
    let keyStatus = await dbq.getBankValidationKey({
        api_key : params.api_key
    })
    
    if(!keyStatus)
        return false;

    if(keyStatus.status !== 'ACTIVE')
        return false
    
        //check to see if the created date is less than 14 days is pending
    let dateCreated = moment(keyStatus.created_at).format('YYYY-MM-DD');
    let dateBeforeFourteenDays = moment().subtract(14,'d').format('YYYY-MM-DD');
    // console.log('dateCreated',dateCreated)
    // console.log('dateBeforeFourteenDays',dateBeforeFourteenDays);return;

    //the validity of the link should be upto 14 days since the creation
    if(dateCreated < dateBeforeFourteenDays){
        return false
    }

    return keyStatus;
}

let updateNewBankDetails = async(params) => {

    let logInfo = await dbq.getBankValidationLog({
        id : params.keyInfo.validation_log_id
    })
    
    await dbq.updateBankValidationLog({
        values: {
            bank_details_new : JSON.stringify(params.payload),
            validation_status: 'RE-ATTEMPT'
        },
        condition: {
                id: logInfo.id
        }
    })
    //updating the corresponding feature tables
    switch(logInfo.feature_name){
        case 'new_bank_update':
            await dbq.updateBankConfirmation({
                values: {
                    sortcode_new: params.payload.sortcode,
                    accountnumber_new: params.payload.accountnumber,
                    bankname_new: params.payload.bank_name,
                    accountholder_new: params.payload.account_holder
                },
                condition: {
                    id: logInfo.feature_reference_id
                }
            })
        break;
        case 'registration_bank_update':
            await dbq.updateOtherCustomerDetails({
                values: {
                    accountnumber: params.payload.accountnumber,
                    sortcode: params.payload.sortcode,
                    bankname: params.payload.bank_name,
                    accountholder: params.payload.account_holder
                },
                condition: {
                    customers_id: logInfo.feature_reference_id
                }
            })
        break;
        default:
            //ideally the flow should'nt come here
    }

    await dbq.updateBankValidationKey({
        values: {
            status: 'EXPIRED'
        },
        condition: {
            id : params.keyInfo.id
        }
    })
}

let getMerchantIdForBankValidation = async(params) => {
    try{
        switch(params.feature_name){
            case 'new_bank_update':
                let bankInfo = await dbq.getBankConfirmationDetails({
                    id : params.feature_reference_id,
                    status : 'AWAITING PROCESSING'
                })
                // console.log('bankInfo',bankInfo)
                if(!bankInfo){
                    throw({message: "Merchant id not found!"});
                }
                return bankInfo.customer_id
            break;
            case 'registration_bank_update':
                let customerInfo = await dbq.getCustomer({
                    id : params.feature_reference_id,
                    progress_status : '1'
                })
                if(!customerInfo){
                    throw({message: "Merchant id not found!"});
                }
                return customerInfo.id
            break;
            default:
                throw({message: "Invalid request"});
        }
    }catch (e){
        return false
    }  
}


// module.exports.getDocuments = async (event, context, callback) => {
//     context.callbackWaitsForEmptyEventLoop = false
//     let params;

//     try {
//         let payload = JSON.parse(event.body)
//         let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
//         let merchantId = authoriserPayload.merchant_id


//         /**
//          * request validations
//          */

//         const schema = Joi.object({
//             //  file_names: Joi.array().required()
//             tag: Joi.string().required()
//         })
//         let ok = await schema.validateAsync(payload)
//         let tag = payload.tag
//         // let isfileNamesValid = payload.file_names.every(el => { return s3.isFileKeyValid(el) })
//         let isTagValid = s3.isFileTagValid(tag)
//         if (!isTagValid) {
//             let message = "In a list provide tag is not valid"
//             console.log(message)
//             let response = {
//                 status: "FAIL",
//                 message
//             }
//             return helpers.LambdaHttpResponse2(400, response, headers)
//         }
//         let filesKey = await s3.listKeys(merchantId, tag)
//         if (filesKey.length < 1) {
//             let message = "No files for requested clients"
//             let response = {
//                 status: "FAIL",
//                 message
//             }
//             return helpers.LambdaHttpResponse2(400, response, headers)
//         }

//         console.log('filesKey', filesKey)
//         let urls = []
//          filesKey.map((el,i) => {
//             let url = s3.getSignedUrl(merchantId, el.Key, 'getObject')
//             urls.push(url)
//         })

//         let response = {
//             status: "OK",
//             data: urls
//         }
//         return helpers.LambdaHttpResponse2(200, response, headers)

//     }

//     catch (e) {
//         console.log('CRASHED getDocuments', e)
//         return helpers.LambdaHttpResponse2(400, { message: e }, headers)
//     }
// }

// let sort_code_valid = await checkSortcodeValidation(payload);
// console.log(sort_code_valid);
// if(sort_code_valid.result.code == 201){
//     return helpers.LambdaHttpResponse2(201, { error: 'Sortcode or accountnumber is invalid' }, headers)    
// }
// Account verification validation during account update

module.exports.fetchAllFeeTierInfo = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchantId = authoriserPayload.merchant_id;

  try {
    let feeTierNames = await dbq.getAllFeeTiers();
    const merchantInfo = await dbq.fetchFeeTierId(merchantId);
    const customerFeetierId = merchantInfo.dataValues.fee_tier_id;
    if (!feeTierNames) {
      const response = {
        status: false,
        message: "Fee tiers not found!",
        data: {},
      };
      return helpers.LambdaHttpResponse2(400, response, headers);
    } else {
      let response = {
        status: "success",
        data: { feeTierNames, customerFeetierId },
      };
      return helpers.LambdaHttpResponse2(200, response, headers);
    }
  } catch (e) {
    console.log("CRASHED functionName", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

module.exports.updateFeeTierIdForMerchant = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  try {
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchantId = authoriserPayload.merchant_id;

    let payload = JSON.parse(event.body);

    const merchantInfo = await dbq.getCustomer({ id: merchantId });
    const userId = await getUserId(event);

    if (!merchantInfo) {
      const responseObj = {
        status: false,
        message: "MerchantId not found!",
        data: {},
      };
      return helpers.LambdaHttpResponse2(400, responseObj, headers);
    } else {
      let params = {
        fee_tier_id: payload.data,
        merchant_id: merchantId,
      };

      await dbq.updateFeeTierId(params);
      const response = {
        status: "success",
        message: "FeeTier ID is updated successfully",
      };

      const merchantInfoAfterUpdate = await dbq.getCustomer({ id: merchantId });
      //audit log data
      const updatedFeeTierDto = {
        beforeUpdate: merchantInfo,
        afterUpdate: merchantInfoAfterUpdate,
        tableName: "customers",
      };
      const auditLogData = [updatedFeeTierDto];

      const auditLogDto = {
        data: {
          auditLogData,
          userId: userId,
          merchantId: merchantId,
          lambadaName: "CustomerUpdateFeeTier",
          identity: event.requestContext.identity,
        },
        queueUrl: "https://sqs.eu-central-1.amazonaws.com/584634042267/AuditLogsQueue-dev.fifo",
      };
      await auditLogsPublisher(auditLogDto);
      return helpers.LambdaHttpResponse2(200, response, headers);
    }
  } catch (e) {
    console.log("CRASHED functionName", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

