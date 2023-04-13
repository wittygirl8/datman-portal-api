'use strict';
const Joi = require('@hapi/joi');
const moment = require('moment-timezone');
const dbq = require('./dbq')
const helpers = require('../../library/helpers')
const DbHelpers = require('../../library/helpers/db-helpers')
const {sendEmail} = require('../../library/lib/email.js')


//defining constants
const INTERNAL_TRANSFER_LIMIT = 10000
const INTERNAL_TRANSFER_DESCRIPTION_CHARACTER_LIMIT = 150

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}
module.exports.getFee = async (event, context, callback) => {
    console.log('here upload');
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let feeValues = await dbq.getFee()
        let suppliersData = await dbq.getSuppliers()
        let response = {
            data : {
                feeValues,suppliersData
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch(e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(401, { message: e }, headers)
    }
}

module.exports.getInternalTransferTransactions = async (event, context, callback) => {
    
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let transactions,transfer_type,customer_ids = [],transaction_ids = [],customer_info,refund_info;
        //check if internal_transfer is enabled for the merchant id
        let status = await dbq.checksupplierStatus({supplier_id:authoriserPayload.merchant_id})
        console.log(status.dataValues.internal_transfer_status);
        console.log(status.dataValues.is_supplier);
        if(status.dataValues.internal_transfer_status === 'DISABLED'){
            return helpers.LambdaHttpResponse2(420, { error: 'You are not allowed to perform this action' }, headers)    
        }
        
        if(status.dataValues.is_supplier === 'TRUE'){
            //query for supplier   
            console.log('going inside')
            transactions = await dbq.getTransactionsSupplier({merchant_id:authoriserPayload.merchant_id})
            transfer_type = 'supplier'
        }else{
            //query for sender
            transfer_type = 'sender'
            transactions = await dbq.getTransactionsSender({merchant_id:authoriserPayload.merchant_id})
        }

        console.log(customer_ids);
        //get customer info
        transactions = transactions.map((transaction,index,array) => {
            customer_ids.push(transaction.customer_id);
            customer_ids.push(transaction.recipient_id);
            transaction_ids.push(transaction.ref)
            return {
                ...transaction.dataValues,
                created_at : moment.tz(transaction.dataValues["created_at"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
            }
        })
        customer_ids = Array.from(new Set(customer_ids))
        transaction_ids = Array.from(new Set(transaction_ids))
        
        customer_info = await dbq.getCustomerNames({customer_ids});
        refund_info = await dbq.getRefundInfo({transaction_ids});
        console.log(transaction_ids)

        let response = {
            data : {
                transactions,transfer_type,customer_info,refund_info
            }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch(e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(401, { message: e }, headers)
    }
}       

module.exports.internalTransferActions = async (event, context, callback) => {
    
    context.callbackWaitsForEmptyEventLoop = false

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let schema,response,validation_status,transaction,cancel_status;
        //this function expects an action like create, cancel and refund
        console.log(payload);
        if(payload.action === ""){
            return helpers.LambdaHttpResponse2(401, { error: "Invalid request. Action missing" }, headers)
        }
        
        switch(payload.action) {
            
            case 'create':
              
                //data validation check
                schema =Joi.object({
                    action :Joi.string().required(),
                    supplier_id :Joi.number().required(),
                    amount      :Joi.number().positive().precision(2).required(),
                    description :Joi.string().allow(''),
                    //temporarily disable password check
                    //password    :Joi.string().required()
                });
                validation_status = await schema.validateAsync(payload);

                let accountStatus = await dbq.getAccountStatus({
                    customer_id : authoriserPayload.merchant_id
                });
        
                if (accountStatus.status == '12') {
                    return helpers.LambdaHttpResponse2(422, { error: 'You are not allowed to do internal transfers' }, headers);
                }

                //check internal transfer limit < 10000
                if(payload.amount > INTERNAL_TRANSFER_LIMIT){
                    return helpers.LambdaHttpResponse2(420, { error: 'Internal transfer amount cannot exceed 10000 pounds.' }, headers)    
                }
                //description should be less than 30 characters
                if(`${payload.decription}`.length > INTERNAL_TRANSFER_DESCRIPTION_CHARACTER_LIMIT){
                    return helpers.LambdaHttpResponse2(421, { error: 'Description cannot exceed '+INTERNAL_TRANSFER_DESCRIPTION_CHARACTER_LIMIT+' characters' }, headers)    
                }
                //check if merchant id is having internal transfer enabled
                let senderStatus = await dbq.checkSenderStatus({merchant_id:authoriserPayload.merchant_id})
                if(senderStatus.dataValues.internal_transfer_status === 'DISABLED'){
                    return helpers.LambdaHttpResponse2(422, { error: 'You are not allowed to do internal transfers' }, headers)    
                }
                //validate password
                //temporarily disable password check
                /* let senderPasswordStatus = await dbq.checkPassword({password: payload.password,merchant_id:authoriserPayload.merchant_id})
                if(!senderPasswordStatus){
                    return helpers.LambdaHttpResponse2(423, { error: 'Password is wrong.' }, headers)    
                } */
                //check if merchant id having enough balance
                
                //check supplier id provided is valid and is a supplier
                let supplierStatus = await dbq.checksupplierStatus({supplier_id:payload.supplier_id})
                if(supplierStatus.dataValues.internal_transfer_status === 'DISABLED' || supplierStatus.dataValues.is_supplier === 'FALSE'){
                    return helpers.LambdaHttpResponse2(424, { error: 'Suppier is not valid' }, headers)    
                }

                //check account balance of sender
                let balance_params = {customerId:authoriserPayload.merchant_id}
                let { balance } = await DbHelpers.checkAccountBalance(balance_params)
                let balanceResponse = await DbHelpers.GetAvailableBalance(balance_params,balance);
                balance  = balanceResponse.available_balance

                if(parseFloat(balance) < parseFloat(payload.amount)){
                    return helpers.LambdaHttpResponse2(425, { error: 'No enough balance' }, headers)
                }

                //create Internal Transfer
                let result = await dbq.createInternalTransfer({
                    payload,merchant_id:authoriserPayload.merchant_id
                })
                //email notify the clients
                let notifyStatus = await notifyClients({
                    transfer_amount: payload.amount,
                    sender_email: senderStatus.dataValues.customers_email,
                    sender_business_name: senderStatus.dataValues.business_name,
                    sender_owner_name: `${senderStatus.dataValues.clients_fname} ${senderStatus.dataValues.clients_sname}`,
                    receiver_email: supplierStatus.dataValues.customers_email,
                    receiver_business_name: supplierStatus.dataValues.business_name,
                    receiver_owner_name: `${supplierStatus.dataValues.clients_fname} ${supplierStatus.dataValues.clients_sname}`
                })
                balanceResponse['balance'] =  (balanceResponse.balance - payload.amount).toFixed(2),
                balanceResponse['available_balance'] = (balanceResponse.available_balance - payload.amount).toFixed(2)
                response = {
                    data : {
                        message:'Created Internal transfer successfully',
                        ...balanceResponse
                    }
                }

            break;

            case 'cancel':
                
                schema =Joi.object({
                    action :Joi.string().required(),
                    transaction_id :Joi.number().required()
                });
                validation_status = await schema.validateAsync(payload);
                console.log(typeof authoriserPayload.merchant_id);
                //check if the merchant_id matches with the customer_id of transaction
                transaction = await dbq.getTransaction({transaction_id:payload.transaction_id})
                if(transaction.dataValues.customer_id !== authoriserPayload.merchant_id
                  && transaction.dataValues.customer_id !== parseInt(authoriserPayload.merchant_id)){
                    return helpers.LambdaHttpResponse2(420, { error: 'You are not allowed to perform this action' }, headers)    
                }

                //check the current status of transaction
                if(transaction.dataValues.status !== 'PENDING'){
                    return helpers.LambdaHttpResponse2(421, { error: 'This transaction cannot be cancelled as its complete already' }, headers)    
                }

                //update cancel
                cancel_status = await dbq.updateTransactionStatus({
                    transaction_id:payload.transaction_id,
                    status : 'CANCELED'
                })

                response = {
                    data : {
                        message: 'Transaction has been Cancelled successfully'
                    }
                }

            break;

            case 'refund':
                
                schema =Joi.object({
                    action :Joi.string().required(),
                    transaction_id : Joi.number().required(),
                    refund_amount  : Joi.number().required(),
                    password       : Joi.string().required()
                });
                validation_status = await schema.validateAsync(payload);
                //check if the requesting user is a supplier
                let status = await dbq.checksupplierStatus({supplier_id:authoriserPayload.merchant_id})
                
                if(status.dataValues.internal_transfer_status === 'DISABLED'){
                    return helpers.LambdaHttpResponse2(420, { error: 'You are not allowed to perform this action' }, headers)    
                }
                
                if(status.dataValues.is_supplier === 'FALSE'){
                    return helpers.LambdaHttpResponse2(421, { error: 'You are not allowed to perform this action' }, headers)    
                }

                //check if the merchant_id matches with the recipient_id of transaction
                transaction = await dbq.getTransaction({transaction_id:payload.transaction_id})
                console.log((transaction.dataValues.recipient_id));
                console.log((authoriserPayload.merchant_id));        
                if(transaction.dataValues.recipient_id !== authoriserPayload.merchant_id
                  && transaction.dataValues.recipient_id !== parseInt(authoriserPayload.merchant_id)){
                    return helpers.LambdaHttpResponse2(422, { error: 'Invalid request' }, headers)    
                }

                //check if the transaction is a completed one
                if(transaction.dataValues.status !== 'COMPLETE'){
                    return helpers.LambdaHttpResponse2(423, { error: 'Refund already processed' }, headers)    
                }

                //check the refund is less than total transaction amount
                if(transaction.dataValues.amount < payload.refund_amount){
                    return helpers.LambdaHttpResponse2(424, { error: 'Refund cannot be greater than transaction amount' }, headers)    
                }        

                //check password
                let passwordStatus = await dbq.checkPassword({password: payload.password,merchant_id: authoriserPayload.merchant_id})
                if(!passwordStatus){
                    return helpers.LambdaHttpResponse2(425, { error: 'Password is wrong.' }, headers)    
                }

                let refundStatus = await dbq.refundTransaction({
                    refund_amount : payload.refund_amount,
                    transaction_id: payload.transaction_id,
                    refund_type: (transaction.dataValues.amount === payload.refund_amount) ? 'FULL' : 'PARTIAL',
                    refunded_by: 'RECIPIENT'
                })
                cancel_status = await dbq.updateTransactionStatus({
                    transaction_id:payload.transaction_id,
                    status : 'REFUNDED'
                })
                response = {
                    data : {
                        message: 'Refund has been initiated successfully'
                    }
                }
            break;

            default:
                return helpers.LambdaHttpResponse2(401, { error: "Invalid request. Undefined action `${payload.action}`" }, headers)
        }

        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch(e) {
        console.log('CRASHED functionName', e)
        return helpers.LambdaHttpResponse2(401, { message: e }, headers)
    }
}

let notifyClients = (params) => {
    /* 
    params =>   transfer_amount,
                sender_email,
                sender_business_name,
                sender_owner_name,
                receiver_email,
                receiver_business_name,
                receiver_owner_name
    */
    let subject = "Internal Transfer - Datman LTD";
    let sender_message = `Hi ${params.sender_owner_name},
            <p>You have initiated an internal transfer of amount <b>&pound;${params.transfer_amount}</b>  to <b>${params.receiver_business_name}</b>.
            This will reflect in the receiver's Datman account on next Friday. 
            You can cancel this transaction by logging into your datman account, under 'Internal transactions' page. 
            </p><br>`;
    let receiver_message = `Hi ${params.receiver_owner_name},
        <p><b>${params.sender_business_name}</b> takeaway has initiated an internal transfer of amount <b>&pound;${params.transfer_amount}</b> to your Datman Account. 
        <br><br>This will take 2-3 business days to reflect in your Datman Main Balance. 
        For more details, login to your Datman account and go to \'Internal Transfer section\' page. </b></p><br>`;
    let sender_email_response = sendEmail({
        email: params.sender_email,
        subject: subject,
        message: sender_message
    })
    let receiver_email_response = sendEmail({
        email: params.receiver_email,
        subject: subject,
        message: receiver_message
    })
    return Promise.resolve({sender_email_response,receiver_email_response})
}
