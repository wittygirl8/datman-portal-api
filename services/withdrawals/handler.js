
// const async = require('async');
// const Joi = require('@hapi/joi');
// var converter = require('number-to-words')

const gDbq = require('../../database/global-db-queries')
// const { getCurrentAndNextTuesday } = require('../../library/helpers')
const helpers = require('../../library/helpers')
const DbHelpers = require('../../library/helpers/db-helpers')
const dbq = require('./dbq')
const moment = require("moment")
const email = require("../../library/lib/email");
const sms = require("../../library/lib/sms");
// const NO_NUMBER_FOUND = "NO_NUMBER_FOUND";

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

// let checkCustomerExists = (info, cb) => {

//     gDbq.isCustomerExists(info).then((business_details) => {

//         cb(null, info, business_details)

//     }, (err) => {
//         let errType = NO_NUMBER_FOUND;
//         let errPayload = {
//             errType,
//             err
//         }
//         cb(errPayload)
//     })
// }

// let frameMessage = (info, business_details, cb) => {
//     // console.log()
//     console.log('here you go with business_details ', business_details)
//     let infoss = { customerId: business_details.id }
//     let { nextTuesday } = getCurrentAndNextTuesday()
//     let ivrMessage;

//     dbq.pendingPayment(infoss).then((val) => {
//         let { totalWithdrawalAmount } = val
//         let positveWithdrawalValue = totalWithdrawalAmount * -1
//         console.log('totalPendingWithdrawal', positveWithdrawalValue)
//         let totalInWord = converter.toWords(positveWithdrawalValue) //multiplied by -1 to make the integer positve
//         console.log('lets check', positveWithdrawalValue, totalInWord)

//         // ivrMessage = `You      will     receive   your     withdrawal     for    amount     ${totalInWord} pounds    approximately   in   your   account   by   Tuesday  ${nextTuesday.date}  ${nextTuesday.month} by 5 pm`

//         ivrMessage = `You      will     receive   your     withdrawal     for      ${totalInWord} pound    approximately   in   your   account   by   5pm Tuesday  ${nextTuesday.date}  ${nextTuesday.month}`;

//         if (positveWithdrawalValue <= 0) {
//             ivrMessage = `You have not made any withdrawal requests this week.`
//         }

//         cb(null, ivrMessage)
//     }, (err) => {
//         cb("can not fetch the value from db")
//     })

// }

let checkAccountVerificationStatus = async (params) =>{
    
    let customerInfo = await gDbq.getCustomerDetails({customerId : params.customerId})
    let oldCustomerIdLimit = process.env.WITHDRAWAL_OLD_CUSTOMER_ID_LIMIT;
    // console.log(customerInfo)
    //check if client is a bigfoodie client
    if(customerInfo.signup_link_from === 'BIGFOODIE-IMPORTED'){
        return Promise.resolve({'status':true})
    }
    //check if account has been verified
    if(customerInfo.account_verification_status === 'VERIFIED'){
        return Promise.resolve({'status':true})
    }
    //check if the withdrawal once option has been enabled
    if(customerInfo.enabled_withdrawal_once === 'ENABLED'){
        return Promise.resolve({'status':true})
    }
    //check if he is old client
    let cutoff_date = moment("2019-05-22","YYYY/MM/DD");
    let customer_signup_date = moment(customerInfo.date_created,"YYYY/MM/DD");
    if(customer_signup_date < cutoff_date){
        //check if this old client belongs to the shortlisted batch of 500,if not allow him to do withdrawal
        if(customerInfo.id > oldCustomerIdLimit){
            return Promise.resolve({'status':true})
        }

        //check if client had 3 times withdrawal done already
        let count_withdrawal_attempts = await dbq.checkWithdrawalCount({
            customerId:params.customerId,
            cutoffDate: '2019-05-22'
        })
        if(count_withdrawal_attempts[0].count < 3){
            return Promise.resolve({'status':true})
        }
    }

    return Promise.resolve({'status':false})
}
// module.exports.withdrawal = (event, context, callback) => {
//     context.callbackWaitsForEmptyEventLoop = false

//     let body = JSON.parse(event.body)
//     console.log('the body', body)
//     async.waterfall([
//         /**
//          * This function is dummby to pass the callback to next function
//          * This is done so so we can have a unit test for each function
//          * @param {Fuction} cb 
//          */
//         function dummy(cb) {

//             cb(null, body)
//         },

//         checkCustomerExists,
//         frameMessage

//     ], (err, ivrMessage) => {

//         if (err) {

//             console.log('seems error', err)
//             let errMessage = "Something Went wrong please try again"
//             if (err.hasOwnProperty('errType')) {
//                 if (err.errType == NO_NUMBER_FOUND) {
//                     errMessage = "Sorry, the number you're calling from is not registered. Please call us again with your registered phone number, or visit   our  portal ."
//                 }

//             }
//             return callback(null, {
//                 statusCode: 400,
//                 body: JSON.stringify(errMessage)
//             })

//         }
//         console.log('withdrawal handler ran sucessfully ')

//         callback(null, {
//             statusCode: 200,
//             body: JSON.stringify(ivrMessage)
//         })

//     })

// }




module.exports.withdrawalRequestList = async (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false
    console.log('test cors')
    try {

        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let payload = JSON.parse(event.body)

        // // schema for request validation
        // const schema = Joi.object({
        //     month: Joi.number().required(),
        //     year: Joi.number().required()
        // })
        // // validating the request schmea
        // await schema.validateAsync(payload)


        let params = {
            customerId: authoriserPayload.merchant_id,
            // week: payload.week,
            month: payload.month,
            year: payload.year
        }
        //getting withdrawals not batched
        let notInBatch = await dbq.cardPaymentWithdrawal(params)
        notInBatch = await Promise.all(notInBatch.map(async (record) => {
            return {
                ...record.dataValues,
                time : moment.tz(record.dataValues["time"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
            }
        }))
        //getting withdrawals which are batched
        let batch = await dbq.getBatch(params)
        let inBatch = await Promise.all(batch.map(async (itu) => {
            console.log('chintu', itu)
            let batch_items_list = await dbq.getBatchItems(itu.batch_id)

            let batch_items = await Promise.all(batch_items_list.map(async (batch_item) => {
                let payment = await dbq.getPaymentMethod(batch_item.card_payment_id);
                batch_item.dataValues["method"] = payment.dataValues.method
                return batch_item;

            }))
            
            return {
                ...itu.dataValues,
                account_number: helpers.maskWithStar(itu.dataValues['account_number'],4),
                sort_code: helpers.maskWithStar(itu.dataValues['sort_code'],4),
                date_pending : moment.tz(itu.dataValues["date_pending"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
                date_sent : moment.tz(itu.dataValues["date_sent"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
                batch_items
            }
        }))
        let response = {
            data: {
                not_in_batch: notInBatch,
                in_batch: inBatch
            }

        }

        return helpers.LambdaHttpResponse2(200, response, headers)
    }
    catch (e) {
        console.log('CRASHED', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)

    }
}

module.exports.createWithdrawalRequest = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false
    try {
        let paymentDbq = require('../payments/dbq')

        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let payload = JSON.parse(event.body)
        let params = {}
        
        // schema for request validation
        // const schema = Joi.object({
        //     sortCode: Joi.number().required(),
        //     accountNumber: Joi.number().required()
        // })
        // validating the request schmea
        // await schema.validateAsync(payload)
        params = {
            ...payload,
            customerId: authoriserPayload.merchant_id
        }

        let accountStatus = await dbq.getAccountStatus({
            customer_id : authoriserPayload.merchant_id
        });


        if (accountStatus.status == 12) {
            let message = `Can not take withdrawal request, please try again later`;
            return helpers.LambdaHttpResponse2(200, { status: 'fail', message }, headers)
        }

        // check if requested amount is less than zero
        if (parseFloat(payload.amount) <= 0) {
            let message = `Requested withdrawal amount ${payload.amount} is less than or equal to zero`
            return helpers.LambdaHttpResponse2(200, { status: 'fail', message }, headers)
        }

        //check the withdrawal progress status if already one exists
        let withdrawalProgressStatus = await dbq.getWithdrawalProgress({
            customer_id : authoriserPayload.merchant_id,
            status: 'IN_PROGRESS',
        });
        //if withdrawal status is in progress, dont proceed
        if(withdrawalProgressStatus){
            let message = `Withdrawal request failed, please try again.`
            return helpers.LambdaHttpResponse2(200, { status: 'fail', message }, headers)
        }

        //to prevent race condition, add withdrawal progress status 
        await dbq.updateWithdrawalProgress({
            customer_id : authoriserPayload.merchant_id,
            'status'    : 'IN_PROGRESS'
        });
        // calculate is current account balance
        let { balance } = await DbHelpers.checkAccountBalance(params)
        let balanceResponse = await DbHelpers.GetAvailableBalance(params,balance);
        balance  = balanceResponse.available_balance

        console.log("avaliablebBalance", (balance))
        console.log('request amount', (payload.amount))
        if (parseFloat(payload.amount) > parseFloat(balance)) {
            //update withdrawal progress as finished
            await dbq.updateWithdrawalProgress({
                customer_id : authoriserPayload.merchant_id,
                'status'    : 'FINISHED'
            });
            let message = `Requested withdrawal amount ${payload.amount} is greater than the  avaliable balance ${balance}`
            return helpers.LambdaHttpResponse2(200, { status: 'fail', message, avaliablebBalance: balance }, headers)
        }
        let updated_balance = balance - payload.amount
        updated_balance = parseFloat(updated_balance).toFixed(2);
        //disabling below check for temporary, as per instruction from Heather, https://datman.atlassian.net/browse/AM-1920
        //check the account verification status,
        /* let account_verification_status = await checkAccountVerificationStatus({
            customerId : authoriserPayload.merchant_id
        })

        if(!account_verification_status.status){
            let message = `Sorry! You are required to complete your  account verification before you can withdraw the funds from your account.`
            return helpers.LambdaHttpResponse2(200, { status: 'fail', message, avaliablebBalance: balance }, headers)
        } */
        
        params = {
            ...payload,
            customerId: authoriserPayload.merchant_id,
            ip: event.headers['CF-Connecting-IP'] || "0.0.0.0"
        }
        await dbq.createWithdrawalRequest(params)
        await dbq.disableWithdrawalOnce(params)
        //update cache balance
        await dbq.updateBalance({
            customer_id: authoriserPayload.merchant_id,
            updated_balance
        })
        //update withdrawal progress as finished
        await dbq.updateWithdrawalProgress({
            customer_id : authoriserPayload.merchant_id,
            'status'    : 'FINISHED'
        });
        //notify the client through email and sms
        let userDetails = await dbq.fetchUserEmailPhone({ id: authoriserPayload.merchant_id });

        params = {
            amount: payload.amount,
            customerName: userDetails.clients_fname
        };

        let WithdrawalDate = await nextWithdrawalDate();
        // let timeDiffernceDay = moment(nextWithdrawal).diff(moment.now(), "d"); // 31

        //generic email template message
        const message = `Dear ${params.customerName},
            <br /><br />Your withdrawal request for <b>&pound;`+helpers.formatCurrency(payload.amount)+`</b> has been registered .<br /><br /> The amount will be sent to your account by <b>${WithdrawalDate}</b>.`
        params = {
            from: '"Datman" <info@datman.je>', // sender address
            to: userDetails.customers_email, // list of receivers
            subject: "Withdrawal money request", // Subject line
            message: message
        };

        //commented out sending email from backend as we are already senting an email from new customer portal side (ND-772)
        // await email.sendEmail1(params);

        params = {
            to: userDetails.customers_mobile,
            from: "DML",
            message: `Your withdrawal request for £`+helpers.formatCurrency(payload.amount)+` has been registered. The amount will be sent to your account by ${WithdrawalDate}.`
        };

        try{
            await sms.sendSms1(params);
        }catch (e) {
            console.log('sms notification failed',e)
        }

        balanceResponse['balance'] =  (balanceResponse.balance - payload.amount).toFixed(2),
        balanceResponse['available_balance'] = (balanceResponse.available_balance - payload.amount).toFixed(2)
        let response = {
            status: "OK",
            message: "Your request has been successfully processed",
            ...balanceResponse
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch (e) {
        console.log('CRASHED', e.message)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

module.exports.reverseWithdrawalRequest = async (event, context) => {
    
    try {

        let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
        let payload = JSON.parse(event.body)
        let params = {}
       
        params = {
            customerId: authoriserPayload.merchant_id
        }

        //Check any tranasctions are there in the pending withdrawal state
        let total = await dbq.getPendingWithdrawals({
            customer_id : authoriserPayload.merchant_id
        });

        params = {
            customerId: authoriserPayload.merchant_id,
            total : total.totalWithdrawalAmount*-1,
            ip: event.headers['CF-Connecting-IP'] || "0.0.0.0"
        }

        if (total.totalWithdrawalAmount != 0)
        {
            await dbq.createWithdrawalReversal(params);
        }

        let pendingTransactions = await dbq.getPendingTransactions(params);
        console.log(pendingTransactions,pendingTransactions.length);
        if (pendingTransactions.length != 0) {
            pendingTransactions.map(item =>{
                console.log(item);
                dbq.reversePendingTransactions(item.batch_id);
                var cardpaymentDetails = dbq.getPendingBatchItem(item.batch_id);
                cardpaymentDetails.map(cpitem=>{
                    console.log(cpitem);
                    dbq.reverseCardpaymentDetails(cpitem.card_payment_id);
                })
            })   
        }

        let internalTransfers = await dbq.getPendingInternalTransfers({
            customer_id : authoriserPayload.merchant_id
        })

        if (internalTransfers.internalTransferAmount != 0)
        {
            await dbq.cancelInternalTransfer(params);
        }

        let response = {
            status: "OK",
            message: "Your request has been successfully processed"
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch (e) {
        console.log('CRASHED', e)
        return helpers.LambdaHttpResponse2(400, { message: e }, headers)
    }
}

let checkSpecialWithdrawalDate = () => {
    //this function checks for special expected date scheduled apart from the normal schedule Tuesday 5pm
    //for adding additional date, we need to appent three different variables and an additional if condition like below
    let current_time = moment().format("YYYY-MM-DD HH:mm:ss");
    
    let start_time_1 = moment("2021-02-08 11:00:00").format("YYYY-MM-DD HH:mm:ss");
    let end_time_1 = moment("2021-02-09 16:00:00").format("YYYY-MM-DD HH:mm:ss");
    let expected_time_1 = moment("2021-02-10 05:00:00").format("YYYY-MM-DD HH:mm:ss");

    if(moment(current_time).isBetween(start_time_1, end_time_1)){
        return `${moment(expected_time_1).format("dddd")} 5pm, ${moment(expected_time_1).format("DD-MMM-YYYY")}`
    }
    return false;
}

let nextWithdrawalDate = async () => {
    let d = null;
    let day = moment.tz(process.env.DEFAULT_TIMEZONE).day()
    let hour = moment.tz(process.env.DEFAULT_TIMEZONE).hour()
    let minute = moment.tz(process.env.DEFAULT_TIMEZONE).minute()
    let day_number = {
        this_tuesday : 2,
        this_thursday : 4,
        next_tuesday : 9,
    }
    let specialWithdrawalDate = checkSpecialWithdrawalDate();
    if(specialWithdrawalDate && false){ //disbling checkSpecialWithdrawalDate for a while, as its not working as expected
        return specialWithdrawalDate
    }else{
        if( day < 1 || (day === 1 && (hour < 9 || (hour === 9 && minute <= 30))  ) )
        { //if sundays, or monday(< 09:30), this tuesday 5PM
            d = `${moment.tz(process.env.DEFAULT_TIMEZONE).day(day_number.this_tuesday).format("dddd")} 5pm, ${moment.tz(process.env.DEFAULT_TIMEZONE).day(day_number.this_tuesday).format("DD-MMM-YYYY")}`; //this tuesday
        }else 
        {
            d = `${moment.tz(process.env.DEFAULT_TIMEZONE).day(day_number.next_tuesday).format("dddd")} 5pm, ${moment.tz(process.env.DEFAULT_TIMEZONE).day(day_number.next_tuesday).format("DD-MMM-YYYY")}`; //this thursday
        }
    }
    
    return  d ;
};

// let nextWithdrawalDate = async () => {
//     let d = null;
//     // let day = process.env.TEST_WITHDRAWAL_DAY;
//     // let hour = process.env.TEST_WITHDRAWAL_HOUR;
//     let day = moment().day()
//     let hour = moment().hour()
//     if( day < 1 || (day === 1 && hour < 14) ){ //if sundays, or monday(< 14:00), this tuesday 5PM
//       d = moment()
//         .day(2)
//         .format("DD-MMM-YYYY");
//     } else {
//       d = moment()
//         .day(9)
//         .format("DD-MMM-YYYY"); //'next Tuesday 5PM'
//     }
//     return  d ;
//   };
