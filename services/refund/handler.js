const Joi = require('@hapi/joi');
var axios = require('axios');
const dbq = require('./dbq')
const helpers = require('../../library/helpers')
const sagepay = require('../../library/lib/sagepay')
const optomany = require('../../library/lib/optomany')
const judo = require('../../library/lib/judo')
const barclays = require('../../library/lib/barclays')
const proxy_refund = require('../../library/lib/proxy_refund')
const mypayHelpers = require('../../library/helpers/mypay-helpers')
const moment = require('moment-timezone');
const TIMEZONE = 'europe/london';
const FormData = require('form-data');
const xeroSyncPayments = require("../../library/helpers/xero-sync-payments");

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

/**
 *
 * @param {Object} payload
 * @param {Object} transactionDetails
 * frame the params for the barclays refunds
 * NOTE: make sure you handle try catch in your respective calling methods.
 */
let barclaysRefund = async (payload, transactionDetails) => {
    let params = {
        total: payload.amount,
        CrossReference: transactionDetails.CrossReference
    }
    let res = await barclays.refund(params)
    return res
}

/**
 *
 * @param {Object} payload
 * @param {Object} transactionDetails
 * frame the params for the judopay refunds
 * * NOTE: make sure you handle try catch in your respective calling methods.
 */
let refundJudo = async (payload, transactionDetails) => {
    let params = {
        "receiptId": transactionDetails.CrossReference,
        "amount": payload.amount,
        // "currency": payload.currency,
        "yourPaymentReference": "REF" + transactionDetails.CrossReference

    }
    let res = await judo.refund(params)
    return res
}


/**
 *
 * @param {Object} payload
 * @param {Object} transactionDetails
 * frame the params for the Optomany refunds
 * * NOTE: make sure you handle try catch in your respective calling methods.
 */

let refundOptomany = async (payload, transactionDetails) => {

    params = { reference: transactionDetails.CrossReference }

    //check the refund is not already processed yet
    let getRefund = await dbq.getRefund(params)

    if (getRefund) {
        let message = `Transaction already refunded <optomany>: ${transactionDetails.refund}`
        console.log(message)
        return helpers.LambdaHttpResponse2(208, {
            status: 'fail',
            message
        })
    }

    params = {
        cardPaymentId: '0',
        refrence: transactionDetails.CrossReference,
        amount: payload.amount
    }
    //seed optomany refund
    let optomanyRefundRecord = await dbq.createOptmanyRefund(params)
    console.log('optomanyRefundRecord', optomanyRefundRecord.dataValues)

    //create refund refrence
    let refundRefrence = `${transactionDetails.CrossReference}R${optomanyRefundRecord.dataValues.id}`


    params = { cardPaymentId: transactionDetails.id }
    console.log('cardPaymentId', params)

    //fetch optomany merchant token
    let optomanyPaymentDetails = await dbq.getOptomanyPayment(params)
    console.log('optomanyPaymentDetails', optomanyPaymentDetails.dataValues)

    //request config
    let config = optomany.requestConfig(transactionDetails.provider)
    console.log('config', config)

    let authorizeReq = {
        Reference: refundRefrence,
        AuthenticationDetails: 'placeholder',
        SendAttempt: 1,
        Amounts: {
            Amount: payload.amount,
            CurrencyId: 826,
        },
        AuthorizationType: 'Refund',
        CaptureModeType: 'AccountOnFile',
        CardholderEngagementMethodType: 'MailOrder',
        CountryId: 826,
        MerchantDepartmentId: config.MerchantDepartmentId,
        TokenDetails: {
            MerchantTokenId: optomanyPaymentDetails.MerchantTokenId,
        }
    }

    console.log('authorizeReqDetails', authorizeReq)
    //start async
    let authorizeResp = await optomany.Authorize(authorizeReq, config)
    await optomany.Settle(authorizeReq, authorizeResp, config)

    params = {
        outcome: 1,
        reason: payload.reason,
        cardPaymentId: transactionDetails.id,
        optomanyRefundId: optomanyRefundRecord.dataValues.id
    }
    let updateOptmanyRefundRes = await dbq.updateOptmanyRefund(params)
    return updateOptmanyRefundRes
}


/**
 *
 * @param {Object} payload
 * @param {Object} transactionDetails
 * frame the params for the refundSagepay refunds
 * * NOTE: make sure you handle try catch in your respective calling methods.
 */

let refundSagepay = async (payload, transactionDetails) => {

    params = {
        ...transactionDetails,
        amount: payload.amount,
        reason: payload.reason
    }
    let sageResponse = await sagepay.refund(params)
    console.log(sageResponse, 'sageResponse')
    return sageResponse
}


/**
 * ==> Handler
 * refund handler for all refunds
 */
module.exports.refund = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {

        let headers = (event.headers);
        let payload = JSON.parse(event.body);
        let params;

        //Schema for the key validation of the request body
        const schema = Joi.object({
            order_id: Joi.number().required(),
            amount: Joi.number().precision(2).required(),
            reason: Joi.string().required(),
            host: Joi.string().required(), //check domain
            merchant_id: Joi.number().required(),
            silent: Joi.boolean() // default false, optional
        })

        //validating the request body
        await schema.validateAsync(payload)
        if (!payload.hasOwnProperty('silent')) {
            payload['silent'] = 0;
        }

        //lookup in db based on following details
        params = {
            orderId: payload.order_id,
            customerId: payload.merchant_id,
            paymentStatus: 'OK'
        }

        let transactionDetails = await dbq.getTransaction(params)
        console.log('transactionDetails', transactionDetails)
        // check if record exist for existing order if
        if (!transactionDetails) {
            let message = 'No transaction found for order_id'
            console.log(message)
            return helpers.LambdaHttpResponse2(404,
                {
                    status: 'fail',
                    message
                }
            )
        }

        // check if already refunded
        if (transactionDetails.dataValues.refund) {
            let message = `Transaction already refunded : ${transactionDetails.dataValues.refund}`
            console.log(message)
            return helpers.LambdaHttpResponse2(208, {
                status: 'fail',
                message
            })
        }

        // chcek the requested refund should not be greater than the original processed amount.
        console.log('amount', payload.amount)
        console.log('total', transactionDetails.dataValues.total)
        if (payload.amount > transactionDetails.dataValues.total) {
            let message = `Refund amount ${payload.amount} cannot be greater than the original transaction amount ${transactionDetails.total}`
            return helpers.LambdaHttpResponse2(404, {
                status: 'fail',
                message
            })
        }

        //requested refund should not be -ve
        if (payload.amount < 0) {
            let message = `Refund amount '${payload.amount}' cannot be negative`
            return helpers.LambdaHttpResponse2(404, {
                status: 'fail',
                message
            })
        }

        let paymentProvider = transactionDetails.dataValues.payment_provider
        // Initiate the refund based on above payment provider

        if (paymentProvider == 'SAGEPAY') {
            console.log('Refunding via SAGEPAY')
            await refundSagepay(payload, transactionDetails.dataValues)

        }

        else if (paymentProvider == 'BARCLAYS') {
            console.log('Refunding via BARCLAYS')
            await barclaysRefund(payload, transactionDetails.dataValues)
        }

        else if (paymentProvider == 'JUDOPAY') {
            console.log('Refunding via JUDOPAY')
            await refundJudo(payload, transactionDetails.dataValues)
        }

        else if (paymentProvider == 'OPTOMANY') {
            console.log('Refunding via OPTOMANY')
            await refundOptomany(payload, transactionDetails.dataValues)
        }

        else {
            let message = `Provider not currently identified'`
            console.log(message)
            console.log('paypay', paymentProvider)
            return helpers.LambdaHttpResponse2(202, {
                status: 'fail',
                message
            })
        }

        //dont do the below process for silent refunds
        if (!payload.silent) {
            params = {
                reason: `<hr> \n Refunded &pound ${payload.amount} because ${payload.reason}`,
                id: transactionDetails.id
            }
            //update the payment record
            let updatedPayment = await dbq.updateTransaction(params)
            console.log('updatedPayment', updatedPayment)
            return helpers.LambdaHttpResponse2(200, {
                status: 'ok'
            })

            // on above successfull fire an email
        }
    }
    catch (e) {
        console.log('e', e)
        return helpers.LambdaHttpResponse2('403', {
            message: e
        })

    }

}


module.exports.portalRefund = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;

    try {
        let payload = JSON.parse(event.body)
        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        // const schema = Joi.object({
        //     order_id: Joi.number(),
        //     amount: Joi.number(),
        //     reason: Joi.string(),
        //     host: Joi.string(),
        // })
        // await schema.validateAsync(payload)
        params = {
            ...payload,
            merchant_id: authoriserPayload.merchant_id,
            host: authoriserPayload.host
        }

        const defaultPaymentProvider = params.payment_provider ? params.payment_provider : 'CARDSTREAM'

        //for datman customers,
        //all datman customers belongs to T2S reseller and we have single CS merchant id
        //datman customers may have transactions happening through different providers OPTOMANY/CARDSTREAM/BARCLAYS etc
        //{amount,order_id,reason} will be required payload, given order_id is unique for throughout all datman transactions
        //for the above reasons, datman refund will be addressed through the proxy_refund function
        //for mypay customers,
        //as different merchant_id belongs to different business, we have different CS merchant ids
        //{amount,payment_id,reason} will be the required payload
        //since we cannot assume order_id to be unique, mypay refund payload should send card_payment_id for uniqueness

        let accountStatus = await dbq.getAccountStatus({
            customer_id : authoriserPayload.merchant_id
        });

        if (accountStatus.status == 12) {
            var message = "Can not refund the amount as the account not in verified status";
            return helpers.LambdaHttpResponse2(400, {outcome:'failed',message}, headers)
        }
        
        //for datman customers, 
            //all datman customers belongs to T2S reseller and we have single CS merchant id
            //datman customers may have transactions happening through different providers OPTOMANY/CARDSTREAM/BARCLAYS etc
            //{amount,order_id,reason} will be required payload, given order_id is unique for throughout all datman transactions
            //for the above reasons, datman refund will be addressed through the proxy_refund function
        //for mypay customers, 
            //as different merchant_id belongs to different business, we have different CS merchant ids
            //{amount,payment_id,reason} will be the required payload
            //since we cannot assume order_id to be unique, mypay refund payload should send card_payment_id for uniqueness
        
        //check if this client is a datman/mypay client
        let customerInfo = await dbq.getCustomers({
            customerId: authoriserPayload.merchant_id
        })
        // console.log(customerInfo);
        let res = { outcome: 'fail', message: 'Invalid client' };

        if (customerInfo.customer_type === 'DATMAN') {
            //for datman clients use datmanpay proxy refund
            res = await proxy_refund.proxyRefund(params)

        } else if (customerInfo.customer_type === 'OMNIPAY') {
            //refund implementation for mypay transactions
            if (!params.payment_id || !params.amount || !params.reason || !params.payment_provider || !params.TxnReference) {
                message = "Required parameters missing (mypay)"
                return helpers.LambdaHttpResponse2(400, { outcome: 'failed', message }, headers)
            }
            
            res = await PaymentProviderToRefundFunction[
                defaultPaymentProvider
            ](params);
        }

        return helpers.LambdaHttpResponse2(200, res, headers)

    }
    catch (e) {
        console.log('CARSHED', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

let dnaRefund = async (params) => {
    let paymentInfo = await dbq.mypayGetPaymentTransaction({
      card_payment_id: params.payment_id,
      merchant_id: params.merchant_id,
      payment_status: "OK",
      payment_provider: "DNA",
      [helpers.transactionReferenceColumn['DNA']]: helpers.decryptData(params.TxnReference)
    });

    if (!paymentInfo) {
        paymentInfo = await dbq.mypayGetPaymentTransaction({
            card_payment_id: params.payment_id,
            merchant_id: params.merchant_id,
            payment_status: 1,
            payment_provider: 7,
            [helpers.transactionReferenceColumn['DNA']]: helpers.decryptData(params.TxnReference)
          });
    }

    if (!paymentInfo) {
        message = "Payment not found"
        return { outcome: 'failed', message }
    }
    if (Number(params.amount) > Number(paymentInfo.total) || Number(params.amount) <= 0) {
        return { outcome: 'failed', message: 'Invalid amount' };
    }

    let RefundValidateStatus = await ValidateRefundAmount({
        ...params,
        ...paymentInfo.dataValues
    })
    console.log('RefundValidateStatus', RefundValidateStatus);
    if (!RefundValidateStatus.status) {
        message = RefundValidateStatus.error_message;
        return { outcome: 'failed', message }
    }

    //check if params.amount is not equal to or less than zero and more than sale amount
    //throw error if yes
    console.log('paymentInfo', paymentInfo)
    console.log('params.amount !== paymentInfo.total', params.amount !== paymentInfo.total)
    console.log('params.amount', params.amount)
    console.log('params.amount < 0', params.amount < 0)

    const dnaAuthPayload = {
        scope: 'webapi',
        client_id: process.env.DNA_CLIENT_ID,
        client_secret: process.env.DNA_CLIENT_SECRET,
        grant_type: 'client_credentials',
        authUrl: process.env.DNA_AUTH_URL
    }

    let dnaAuthResponse = await getDNAAuth(dnaAuthPayload);
    console.log('dnaAuthResponse', dnaAuthResponse)
    
    if (!dnaAuthResponse) throw 'dnaAuthResponse is undefined';

    const dnaRefundPayload = {
        id: paymentInfo.cross_reference,
        amount: Number(params.amount)

    }

    console.log('DNA Refund API Payload', dnaRefundPayload);
    let dnaRefund = await processDNARefund(dnaAuthResponse, dnaRefundPayload);
    console.log('DNA refund response', dnaRefund)
    await dbq.createDnaRefundLogs({
        payment_id: paymentInfo.id,
        raw_data: JSON.stringify(dnaRefund)
    });

    if (!dnaRefund.success) throw dnaRefund.message

    let date = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    let refund_text_negative_entry = `<hr>\n ${RefundValidateStatus.RefundKeywordForRefund} &pound; ${params.amount} because ${params.reason} \n <hr> \nTxn dated ${paymentInfo.created_at}(#${paymentInfo.id})`;
   
    let create_payment_refund_params = {
        merchant_id: paymentInfo.merchant_id,
        order_id: paymentInfo.order_id,
        total: `-${Number(params.amount).toFixed(2)}`,
        fees: 0,
        payed: `-${Number(params.amount).toFixed(2)}`,
        refund: refund_text_negative_entry,
        cross_reference: paymentInfo.cross_reference,
        provider: paymentInfo.provider,
        payment_provider: paymentInfo.payment_provider,
        payment_status: 'OK',
        email: paymentInfo.email
    };

    const dnaPaymentRefund = await dbq.createDNAPaymentRefund(create_payment_refund_params);
    const paymentTransactionDetails = await dbq.getPaymentTransactionDetails({ payment_id: paymentInfo.id })
    if (paymentTransactionDetails) {
        const paymentTransactionDto = paymentTransactionDetails.dataValues
        await dbq.createPaymentTransactionDetails({
            payment_transaction_id: dnaPaymentRefund.id,
            firstname: 'Refund',
            lastname: `${paymentTransactionDto.firstname} ${paymentTransactionDto.lastname}`,
            origin: paymentTransactionDto.origin,
            address: paymentTransactionDto.address,
            method: paymentTransactionDto.method,
        })
    }
    //2.flagging existing transaction record with refund status
    //$refund_text_positive_entry = "\n<hr>\n Refunded &pound;".$request->input->amount." because ".$request->input->reason."\n <hr> \n@".date("Y-M-d H:i:s")." (#".$card_payment_refund_record_id.")";
    const TotalRefundAmount = parseFloat((RefundValidateStatus['RefundedTotal'] + Number(params.amount))).toFixed(2);
    const refund_text_positive_entry = `<hr>\n ${RefundValidateStatus['RefundKeywordForSale']} &pound; ${TotalRefundAmount} because ${params.reason}\n <hr> \n ${date} (#${dnaPaymentRefund.id}).`;
    await dbq.updateDNAPaymentRefund({
        id: paymentInfo.id,
        refund_reason: refund_text_positive_entry
    });

    //populate refund_request_log
    await dbq.createRefundRequestLog({
        card_payment_id: paymentInfo.id,
        silent_mode: '0',
        amount: params.amount,
        payload: params
    })

    let api_response = {
        outcome: 'success'
    };

    const refundObject = {
        amount: Number(params.amount).toFixed(2),
        transactionDate: date,
        transactionReference: paymentInfo.cross_reference,
        type: "SPEND"
    };
    await xeroSyncPayments.syncTransactionsToXero(refundObject);


    // sends the http response with status 200
    return api_response;

};

const  getDNAAuth = async (obj) => {
    try {
        var data = new FormData();
        data.append('scope', obj.scope);
        data.append('grant_type', obj.grant_type);
        data.append('client_secret', obj.client_secret);
        data.append('client_id', obj.client_id);

        var config = {
            method: 'post',
            url: obj.authUrl,
            headers: {
                ...data.getHeaders()
            },
            data: data
        };

        let responseDnaAuth = await axios(config);
        return responseDnaAuth.data;
    } catch (error) {
        console.log('DNA auth error',error.response.data)
        throw error.response.data
    }
};

const processDNARefund = async(authObj, payLoad) => {
    try {
        const data = JSON.stringify(payLoad);
        console.log('DNA refund json payload', data)
        const config = {
            method: 'post',
            url: process.env.DNA_REFUND_URL,
            headers: { 
              'Authorization': `Bearer ${authObj.access_token}`, 
              'Content-Type': 'application/json'
            },
            data : data
        };
        console.log('DNA refund config object', config)
        let responseDnaRefundProcess = await axios(config);
        return responseDnaRefundProcess.data;
    } catch (error){
        console.log('DNA refund error', error.response.data)
        return error.response.data
    }
}

let cardStreamRefund = async (params) => {

    //check if transaction exists
    //throw error if not
    let message;
    let paymentInfo = await dbq.mypayGetTransaction({
        card_payment_id: params.payment_id,
        customer_id: params.merchant_id,
        payment_status: 'OK',
        [helpers.transactionReferenceColumn['CARDSTREAM']]: helpers.decryptData(params.TxnReference)
    })
    if (!paymentInfo) {
        message = "Payment not found"
        return { outcome: 'failed', message }
    }
    if (Number(params.amount) > Number(paymentInfo.total) || Number(params.amount) <= 0) {
        return { outcome: 'failed', message: 'Invalid amount' };
    }
    //validate Refund status
    let RefundValidateStatus = await ValidateRefundAmount({
        ...params,
        ...paymentInfo.dataValues
    })
    console.log('RefundValidateStatus', RefundValidateStatus);
    if (!RefundValidateStatus.status) {
        message = RefundValidateStatus.error_message;
        return { outcome: 'failed', message }
    }

    //check if params.amount is not equal to or less than zero and more than sale amount
    //throw error if yes
    console.log('paymentInfo', paymentInfo)
    console.log('params.amount !== paymentInfo.total', params.amount !== paymentInfo.total)
    console.log('params.amount', params.amount)
    console.log('params.amount < 0', params.amount < 0)

    //all sale should be of type cardstream (as of Nov 2020)
    //throw error if not
    console.log(paymentInfo.payment_provider);
    if (paymentInfo.payment_provider !== 'CARDSTREAM') {
        message = "Refund cannot be processed (Provider error)"
        return { outcome: 'failed', message }
    }

    //get cs merchant id for this particular client
    let csSettings = await dbq.getCsSettings({
        merchant_id: params.merchant_id
    });
    console.log(csSettings);

    //get query sate of transaction
    let transaction_state = await mypayHelpers.processCardStreamPayment(
        {
            action: 'QUERY',
            merchantID: csSettings.cs_merchant_id,
            xref: paymentInfo.VendorTxCode
        },
        csSettings.cs_signature_key
    );
    console.log('transaction State', transaction_state);
    if (transaction_state.responseCode !== 0) {
        throw { message: `${transaction_state.responseMessage}` };
    }

    let refundCsPayload = await getRefundCsPayload({
        transaction_state, paymentInfo, csSettings,
        payload: params
    })

    if (!refundCsPayload) {
        throw { message: `Can not refund amount. Transaction current state: ${transaction_state.state}` };
    }

    console.log('refundCsPayload', refundCsPayload);

    //do refund with cardstream by cancelling the sale
    let cs_response = await mypayHelpers.processCardStreamPayment(refundCsPayload, csSettings.cs_signature_key);
    console.log('cs_response after refund', cs_response)
    //populate cardstream refund log
    await dbq.createCardStreamRefundLog({
        card_payment_id: paymentInfo.id,
        xref: cs_response.xref,
        amount: params.amount,
        outcome: cs_response.responseCode === 0 ? "1" : "0",
    });

    //1. adding negative entry for Refunds instead of resetting the transaction amount to zero
    let date = moment().tz(TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    let refund_text_negative_entry = `<hr>\n ${RefundValidateStatus.RefundKeywordForRefund} &pound; ${params.amount} because ${params.reason} \n <hr> \nTxn dated ${paymentInfo.time}(#${paymentInfo.id})`;
    const negative_amount_info = await CalculateFee({
        merchant_id: params.merchant_id,
        total: params.amount
    })
    console.log('negative_amount_info', negative_amount_info);
    let create_payment_refund_params = {
        customer_id: paymentInfo.customer_id,
        order_id: paymentInfo.order_id,
        firstname: 'Refund',
        lastname: `${paymentInfo.firstname} ${paymentInfo.lastname}`,
        address: paymentInfo.address,
        total: `-${Number(negative_amount_info.total).toFixed(2)}`,
        fees: `-${Number(negative_amount_info.fees).toFixed(2)}`,
        payed: `-${Number(negative_amount_info.payed).toFixed(2)}`,
        refund: refund_text_negative_entry,
        time: date,
        CrossReference: paymentInfo.CrossReference,
        payment_provider: paymentInfo.payment_provider,
        payment_status: 'OK',
        week_no: moment().tz(TIMEZONE).format('W'),
        email: paymentInfo.email
    };
    const cardPaymentRefund = await dbq.createPaymentRefund(create_payment_refund_params);
    //2.flagging existing transaction record with refund status
    //$refund_text_positive_entry = "\n<hr>\n Refunded &pound;".$request->input->amount." because ".$request->input->reason."\n <hr> \n@".date("Y-M-d H:i:s")." (#".$card_payment_refund_record_id.")";
    const TotalRefundAmount = parseFloat((RefundValidateStatus['RefundedTotal'] + Number(params.amount))).toFixed(2);
    const refund_text_positive_entry = `\n<hr>\n ${RefundValidateStatus['RefundKeywordForSale']} &pound; ${TotalRefundAmount} because ${params.reason}\n <hr> \n ${date} (#${cardPaymentRefund.id}).`;
    await dbq.updatePaymentRefund({
        id: paymentInfo.id,
        refund_reason: refund_text_positive_entry
    });

    //populate refund_request_log
    await dbq.createRefundRequestLog({
        card_payment_id: paymentInfo.id,
        silent_mode: '0',
        amount: params.amount,
        payload: params
    })

    const refundObject = {
        amount: Number(negative_amount_info.total).toFixed(2),
        transactionDate: date,
        transactionReference: paymentInfo.CrossReference,
        type: "SPEND"
    };
    await xeroSyncPayments.syncTransactionsToXero(refundObject);

    let api_response = {
        outcome: 'success'
    };

    // sends the http response with status 200
    return api_response;
}

const PaymentProviderToRefundFunction = {
  DNA: dnaRefund,
  CARDSTREAM: cardStreamRefund,
};


const CalculateFee = async (params) => {
    let feeInfo = await dbq.getFeeInfo(params);
    console.log('fee info', feeInfo);
    const total = Number(params.total);
    let fees = 0.00;

    if (feeInfo.length) {
        feeInfo = feeInfo[0];
        fees = total * (Number(feeInfo.percentage_fee) / 100);
        fees = fees + Number(feeInfo.fixed_fee);
    } else {
        fees = total * 0.034;
        fees = fees + 0.20;
    }
    fees = Number(fees).toFixed(2);
    const payed = Number(total) + 0.20;

    return {
        total,
        fees,
        payed
    }
}
let getRefundCsPayload = async (params) => {
    let { transaction_state, paymentInfo, csSettings, payload } = params
    let array_settled_transaction_state = ['accepted', 'tendered', 'deferred'];
    let array_not_settled_transaction_state = ['received', 'approved', 'captured'];

    //check for valid transaction state
    if (
        !array_settled_transaction_state.includes(transaction_state.state)
        &&
        !array_not_settled_transaction_state.includes(transaction_state.state)
    ) {
        return false;
    }

    //for settled transaction, we give a 'REFUND_SALE' request
    if (array_settled_transaction_state.includes(transaction_state.state)) {
        return {
            action: 'REFUND_SALE',
            merchantID: csSettings.cs_merchant_id,
            xref: paymentInfo.VendorTxCode,
            amount: Math.round(Number(payload.amount) * 100) // multiplying by 100 to change amount in cents
        }
    }

    //for non-settled transactions, we either 'cancel'/'capture' the sale based on full/partial refund
    //1.when full refund, 'cancel' the sale instead of 'capture'
    //2.when refunding for the first time, transaction_state.amountReceived will be equal to sale amount
    //2a. so capture the sale with remaining amount
    //3.when partial refunding for the second time onwards,  transaction_state.amountReceived will be based on last partial refund done
    //3a.in this case, we need to re-calculate the capture amount re-capture the sale again
    //3b. On final partial refund, 'cancel' the whole sale instead of 'capture' ing it as there is nothing to capture

    //#1
    if (Number(payload.amount) === Number(paymentInfo.total)) {
        return {
            action: 'CANCEL',
            merchantID: csSettings.cs_merchant_id,
            xref: paymentInfo.VendorTxCode,
        };
    }

    //#2 and #2a
    let capture_amount;
    if (Number(paymentInfo.total) * 100 === transaction_state.amountReceived) {
        capture_amount = Math.round((Number(paymentInfo.total) - Number(payload.amount)) * 100);
        return {
            action: 'CAPTURE',
            merchantID: csSettings.cs_merchant_id,
            xref: paymentInfo.VendorTxCode,
            amount: capture_amount // in cents
        };
    }

    //#3, #3a and #3b
    let amountReceived = transaction_state.amountReceived / 100;
    let prevRefundedAmount = Number(paymentInfo.total) - amountReceived;
    capture_amount =
        Math.round((Number(paymentInfo.total) - (prevRefundedAmount + Number(payload.amount))) * 100);
    let refundCsPayload = {
        action: capture_amount === 0 ? 'CANCEL' : 'CAPTURE',
        merchantID: csSettings.cs_merchant_id,
        xref: paymentInfo.VendorTxCode,
    };
    if (refundCsPayload.action === 'CAPTURE') {
        refundCsPayload['amount'] = capture_amount;
    }

    return refundCsPayload;

}


let ValidateRefundAmount = async (params) => {
    //throw error
    //1. Full refund already processed
    //2. Requested partial refund exceeds remaining sale amount
    let RefundedInfo;
    if (params.payment_provider === 'DNA') {
        RefundedInfo = await dbq.getPaymentTransactionRefundedPayment(params);
    } else {
        RefundedInfo = await dbq.getRefundedPayment(params);
    }
    console.log('refund info', RefundedInfo)
    const RefundAmount = params.amount;
    let SaleAmount = params.total;
    let RefundedTotal = 0.00;
    let RefundedReasons = [];
    if (RefundedInfo.length) {
        RefundedInfo.forEach(refund => {
            console.log('refund=======>', refund)
            RefundedTotal += (refund.total * Math.sign(refund.total));
            console.log('RefundedTotal', RefundedTotal)
            RefundedReasons.push(refund.reason);
        })
    }
    console.log('RefundAmount', RefundAmount);
    console.log('SaleAmount', SaleAmount);
    console.log('RefundedTotal', RefundedTotal);
    let RefundEligibleAmount = parseFloat(SaleAmount - RefundedTotal).toFixed(2);
    console.log('RefundEligibleAmount', RefundEligibleAmount);
    //throw error if refund requesting amount is greter than remaining refund eligible amount
    if (Number(RefundEligibleAmount) === 0) {
        return {
            status: false,
            error_message: `Transaction already refunded: ${params.refund}`
        }
    } else if (RefundAmount > RefundEligibleAmount) {
        return {
            status: false,
            error_message: `Refund cannot be processed. Please try with an amount less than or equal to (${RefundEligibleAmount})`
        }
    }

    return {
        status: true,
        RefundedTotal,
        RefundedReasons,
        FlagPartialRefund: Number(RefundAmount) !== Number(SaleAmount),
        RefundKeywordForRefund: Number(RefundAmount) === Number(SaleAmount) ? "Refunded" : "Partial Refund",
        RefundKeywordForSale: Number(parseFloat((RefundedTotal + RefundAmount)).toFixed(2)) === Number(SaleAmount) ? "Refunded" : "Partial Refund",
    }
}