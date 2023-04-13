const dbq = require('./dbq')
const helpers = require('../../library/helpers')
const mypayHelpers = require('../../library/helpers/mypay-helpers');
const emailHelpers = require('../../library/helpers/email-helper');
const moment = require('moment-timezone');
const TIMEZONE = 'europe/london';
const { createSessionSchema } = require('../../library/helpers/schema')
const xeroSyncPayments = require("../../library/helpers/xero-sync-payments");

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true
}

const CS_ACTION = 'SALE'
const CS_TYPE = 2
const CS_DUPLICATE_DELAY = 1
const CARD_PAYMENT_SUCCESS_STATUS = 'OK'
const CARD_PAYMENT_ORIGIN = 'Mypay-VT'
const CARD_PAYMENT_METHOD = 'New Card'
const CP_NOT_SPECIFIED = '';

module.exports.createSaleVt = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false

    try {
      let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload)
      let payload = JSON.parse(event.body);
      let merchant_id = authoriserPayload.merchant_id
      // console.log(authoriserPayload);
      // console.log(dbq)
      //get user settings
      let userSetting = await dbq.getCustomer({merchant_id})
      
      if(userSetting.customer_type !== 'OMNIPAY'){
        throw({message:"Invalid client"})
      }

      if(userSetting.payment_provider === 'CARDSTREAM'){
        //getting cs settings
        let csSettings = await dbq.getCsSettings({merchant_id});
        if(!csSettings){
          throw({message:"Missing Configurations"})
        }
        
        //create new Item Entry
        let itemReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.ITEM_REF);
        let createItemResponse = await dbq.createItem({
            data: JSON.stringify(payload.data),
            ref: itemReference
        });
        //console.log(createItemResponse);
        //create new Shopper Entry
        //Saving email coming from frontend(for receipts) to recipients_email column in mypay_shoppers
        let shopperReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.SHOPPER_REF);
        let createShopperResponse = await dbq.createShopper({
            ref : shopperReference,
            first_name : payload.shoppers.first_name,
            last_name : payload.shoppers.last_name,
            email : payload.shoppers.email,
            recipients_email : payload.shoppers.recipients_email ? payload.shoppers.recipients_email : '',
            address : payload.shoppers.address,
            description: payload.description ? JSON.stringify(payload.description) : '-'
        });
        let shopperInfo = createShopperResponse.dataValues;
        //console.log('shopperInfo',shopperInfo)
        
        //create new TempTransaction Entry
        let tempTransactionReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.TEMP_TRANS_REF);
        let createTempTransactionResponse = await dbq.createTempTransactions({
            ref: tempTransactionReference,
            customer_id: merchant_id,
            user_order_ref: payload.user_order_ref,
            shopper_id: createShopperResponse.dataValues.id,
            item_id: createItemResponse.dataValues.id,
            amount: payload.amount,
            currency_code: payload.currency_code,
            status : 'IN_PROGRESS'
        });
        let sessionInfo = createTempTransactionResponse.dataValues;
        //console.log(createTempTransactionResponse)

        //do cs sale api
        let cs_response = await mypayHelpers.processCardStreamPayment({
            action: CS_ACTION,
            type: CS_TYPE, 
            duplicateDelay: CS_DUPLICATE_DELAY,  
            amount: payload.amount,
            cardNumber: payload.card_number,
            cardExpiryMonth: payload.card_exp_month,
            cardExpiryYear: payload.card_exp_year,
            cardCVV: payload.card_cvv,
            currencyCode: payload.currency_code, //826
            merchantID: csSettings.cs_merchant_id,
            countryCode: csSettings.country_code, //826
            customerName:
              `${shopperInfo.first_name} ${shopperInfo.last_name}`,
          customerPostCode: payload.billing_post_code,
          customerAddress: payload.billing_address,
            transactionUnique: tempTransactionReference,
        },csSettings.cs_signature_key);

        //console.log(cs_response);
        //check if transaction is failure, then throw error
        if (cs_response.responseCode !== 0) {
          //something wrong happened with card stream api
          let errorResponse = {
            error: {
              message     : `Transaction failed: CS- ${cs_response.responseMessage} - ${cs_response.responseCode}`,
              type        : 'PAYMENT_FAILED'
            }
          };
          return helpers.LambdaHttpResponse2(401, errorResponse, headers)
        }
      
        let CardstreamTransactionLog = await dbq.createCsTransactionLog({
          action: cs_response.action,
          xref: cs_response.xref,
          raw_response: JSON.stringify(cs_response)
        });

        let transacRef = `tr_${cs_response.xref}`;
        let mydate = new Date();
      
        const fee_percent  = 0; //fee can be changed here later based on business requirement
        const fees = (cs_response.amount * fee_percent) / 10000;
        const payed = ((cs_response.amount) - fees);
        const transactionDate = moment(moment().tz('Europe/London')).format('YYYY-MM-DD');
        // push the transaction to main transaction table
        let pushTransactionResp = await dbq.createPayment({
          customer_id: sessionInfo.customer_id,
          order_id: `MP_${sessionInfo.user_order_ref}`,
          total: (cs_response.amount/100).toFixed(2),
          CrossReference: cs_response.transactionUnique,
          VendorTxCode: cs_response.xref,
          TxAuthNo: cs_response.authorisationCode,
          last_4_digits: `${cs_response.cardNumberMask}`.substr(-4),
          fees,
          payed: (payed/100).toFixed(2),
          firstname: shopperInfo.first_name,
          lastname: shopperInfo.last_name,
          more_info: shopperInfo.description,
          email: shopperInfo.email,
          address: shopperInfo.address,
          payment_provider: userSetting.payment_provider,
          correlation_id: CardstreamTransactionLog.dataValues.id,
          payment_status : CARD_PAYMENT_SUCCESS_STATUS,
          origin : CARD_PAYMENT_ORIGIN,
          method : CARD_PAYMENT_METHOD,
          day: mydate.getDate(),
          month: mydate.getMonth() + 1,
          week_no: moment().tz(TIMEZONE).format('W'),
          year: mydate.getFullYear()
        });
        
        await dbq.updateTempTransaction({
          status : 'PROCESSED',
          ref : sessionInfo.ref
        });

        let cardHolderName = payload.shoppers.first_name ? payload.shoppers.first_name : '';

        let confirmation_message = `<h1>Hi ${cardHolderName},</h1><p>Your payment of <b>&pound; ${(payload.amount/ 100).toFixed(2)}</b>&nbsp; to <b>${
          userSetting.business_name
      }</b> has been successfully received.<br> <br> Please note your transaction reference <span style="color: #3869D4; font-weight: 300;"> ${transacRef} </span> </p>`;

      shopperInfo.recipients_email &&
        (await emailHelpers.sendEmail(
          'OMNIPAY',
            {
                email: shopperInfo.recipients_email,
                subject: `Order confirmation - ${transacRef}`,
                message: confirmation_message
            }
        ));

        const paymentObject = {
          amount: (cs_response.amount/100).toFixed(2),
          transactionDate: transactionDate,
          transactionReference: sessionInfo.ref,
          type: "RECEIVE"
        };
        await xeroSyncPayments.syncTransactionsToXero(paymentObject);

        let response = {
          message: 'The request was processed successfully',
          data: {
            success: 'ok',
            transactionRef: transacRef
          }
        }
        return helpers.LambdaHttpResponse2(200, response, headers)

      }else{
        throw({message:"Invalid provider configuration"})
      }

    }
    catch(e) {
        return helpers.LambdaHttpResponse2(401, { message: e.message }, headers)
    }
}


Date.prototype.getWeek = function (dowOffset) {
  /*getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */

  dowOffset = typeof dowOffset === 'number' ? dowOffset : 0; //default dowOffset to zero
  var newYear = new Date(this.getFullYear(), 0, 1);
  var day = newYear.getDay() - dowOffset; //the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  var daynum =
    Math.floor(
      (this.getTime() -
        newYear.getTime() -
        (this.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
      86400000
    ) + 1;
  var weeknum;
  //if the year starts before the middle of a week
  if (day < 4) {
    weeknum = Math.floor((daynum + day - 1) / 7) + 1;
    if (weeknum > 52) {
      let nYear = new Date(this.getFullYear() + 1, 0, 1);
      let nday = nYear.getDay() - dowOffset;
      nday = nday >= 0 ? nday : nday + 7;
      /*if the next year starts before the middle of
                  the week, it is week #1 of that year*/
      weeknum = nday < 4 ? 1 : 53;
    }
  } else {
    weeknum = Math.floor((daynum + day - 1) / 7);
  }
  return weeknum;
};

module.exports.createSessionPayByLink = async (event) =>{
  try{
    const payload = JSON.parse(event.body);
    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    const merchant_id = authoriserPayload.merchant_id;
    const userSetting = await dbq.getCustomer({merchant_id});

    if(!userSetting.customer_type || userSetting.customer_type !== 'OMNIPAY'){
      throw new Error( "Invalid client");
    }

    if(userSetting.payment_provider === 'CARDSTREAM'){
      let csSettings = await dbq.getCsSettings({merchant_id});
      if(!csSettings){
        throw new Error("Missing Configurations");
      }

      await createSessionSchema.validateAsync(payload);

      //populating items tables
      const itemReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.ITEM_REF);
      const itemsParams = {
        data: JSON.stringify(payload.items) || CP_NOT_SPECIFIED,
        ref: itemReference
      };
      const createItemsResponse = await dbq.createItem(itemsParams);

      //populating shoppers table
      const shopperReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.SHOPPER_REF);
      const shoppersParams = {
        ref: shopperReference,
        first_name: payload.shoppers.first_name || CP_NOT_SPECIFIED,
        last_name: payload.shoppers.last_name || CP_NOT_SPECIFIED,
        email : payload.shoppers.email,
        recipients_email: payload.shoppers.recipients_email ? payload.shoppers.recipients_email : '',
        address: payload.shoppers.address || CP_NOT_SPECIFIED,
        description: payload.description ? JSON.stringify(payload.description) : '-' || CP_NOT_SPECIFIED
      };
      const createShopperResponse = await dbq.createShopper(shoppersParams);

      //populating meta
      const metaDataParams = {
        from: "MYPAY_PORTAL",
        redirect_url: `${process.env.MYPAY_REDIRECT_URL}/pay/status`,
        method : 'GET',
        description: payload.description ? payload.description : '-'
      };
      const createMetaResponse = await dbq.createTempTransactionMeta({
        meta_data: JSON.stringify(metaDataParams)
      });

      let orderRef = '';
      if( payload.hasOwnProperty('invoiceId') && payload.invoiceId)
      {
        orderRef = 'M'+merchant_id+'I'+payload.invoiceId
      }
      else
      {
        orderRef = payload.user_order_ref
      }

      let currentDate = moment().tz(TIMEZONE);
      let tempDate = currentDate.clone();
      let expiryDate = tempDate.add(2, "days").format("YYYY-MM-DDTHH:mm:ss[Z]");

      console.log(`Printing currentDate~`, currentDate);
      console.log(`Printing expiryDate~`, expiryDate);

      //populate Temp Transactions table
      const tempTransactionReference = mypayHelpers.generateNanoId(mypayHelpers.constants.refs.TEMP_TRANS_REF);
      const tempTransactionParams = {
        ref: tempTransactionReference,
        customer_id: merchant_id,
        user_order_ref:orderRef,
        shopper_id: createShopperResponse.id,
        item_id: createItemsResponse.id,
        meta_id: createMetaResponse.id,
        amount: payload.amount,
        currency_code: payload.currency_code || csSettings.currency_code,
        status: 'IN_PROGRESS',
        invoice_expiry_date: payload.hasOwnProperty('invoiceExpiryDate') ? payload.invoiceExpiryDate : null,
        link_expiry_date: expiryDate,
      };
      const createTempTransactionResponse = await dbq.createTempTransactions(tempTransactionParams);

      const api_response = {
        data: {
          session_id: createTempTransactionResponse.ref
        }
      };
      return helpers.LambdaHttpResponse2(200, api_response, headers);
    }else {
      throw new Error("Invalid provider configuration");
    }

  }catch (e) {
    console.log('ERROR in CATCH Block', e);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
};
