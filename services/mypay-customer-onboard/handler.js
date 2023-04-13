'use strict';
const dbq = require('./dbq');
const helpers = require('../../library/helpers');
const { mypayCreateCustomerPayloadSchema, mypayCreateMerchantPayloadSchema }  = require('../../library/helpers/schema');
const mypayHelpers = require('../../library/helpers/mypay-helpers')

//having the below headers with response, otherwise it will be problem calling the api from browsers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods' : 'GET,HEAD,OPTIONS,POST',
  'Access-Control-Allow-Headers':'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
};
const CS_SECURITY_KEY = 'shjX4KH9xyGXfGn6';
const CS_STATUS = 'active';
const CS_SUPPORTED_CURRENCIES = 'GBP';
const CS_SOT_ENABLED = 'N';
const CS_IP_ADDR = '18.200.118.19;108.129.18.156';
const CS_SUPPORTED_CARD_TYPES = 'EL,JC,MA,MC,MD,MI,MP,MU,VA,VC,VD,VP';
const CS_ACCEPTED_CARD_TYPES = 'EL,JC,MA,MC,MD,MI,MP,MU,VA,VC,VD,VP';
const CS_3D_CHECK_PREF = 'authenticated,attempted authentication';
const CS_COMPANY_TYPE = 'Merchant Services';
const CS_COUNTRY_CODE = 'GB';
const CS_NUMERIC_COUNTRY_CODE = 826;
const CS_NUMERIC_CURRENCY_CODE = 826;

module.exports.createClient = async (event) => {
  let cs_customer_id, cs_merchant_id;
  const MODE = process.env.MODE;
  try {
    const payload = JSON.parse(event.body);

    await mypayCreateCustomerPayloadSchema.validateAsync(payload);

    let terminalId = await validateTerminalId(payload.tid);
    if (terminalId) {
      terminalId = terminalId.tid
    }

    const customer_params = {
        customerName: payload.customerName,
        contactName: payload.contactName,
        contactAddress1: payload.contactAddress,
        contactTown: payload.contactTown,
        contactCounty: payload.contactCounty,
        contactPostcode: payload.contactPostcode,
        contactPhone: payload.contactPhone,
        contactEmail: payload.contactEmail,
        status: payload.status||CS_STATUS,
        companyType: payload.companyType ||CS_COMPANY_TYPE,
        contactCountryCode: payload.contactCountryCode || CS_COUNTRY_CODE,
        website: payload.url
      };

       cs_customer_id = await mypayHelpers.csCreateCustomer(customer_params, MODE);

       if(!cs_customer_id){
         throw new Error('Failed to create customer');
       }
       const merchant_prams = {
          merchantName: payload.merchantName,
          url: payload.url,
          testMode: changeFlagFormat(payload.testMode),
          threeDSEnabled: changeFlagFormat(payload.threeDSEnabled),
          threeDSRequired: changeFlagFormat(payload.threeDSEnabled),
          acquirerBankName: payload.acquirerBankName,
          processorMerchantID: `${payload.processorMerchantID}-${terminalId}`,
          notifyEmail: payload.notifyEmail,
          processorID: payload.processorID,
          securityKey: CS_SECURITY_KEY,
          status: CS_STATUS,
          supportedCurrencies:payload.supportedCurrencies || CS_SUPPORTED_CURRENCIES,
          sotEnabled: CS_SOT_ENABLED,
          ipAddresses: CS_IP_ADDR,
          supportedCardTypes: CS_SUPPORTED_CARD_TYPES,
          acceptedCardTypes: CS_ACCEPTED_CARD_TYPES,
          threeDSCheckPref: CS_3D_CHECK_PREF,
          merchantCategoryCode: payload.merchantCategoryCode
    };
       console.log('Customer created', cs_customer_id);
       cs_merchant_id = await mypayHelpers.csCreateMerchant(merchant_prams, cs_customer_id, MODE);
       const tidParams ={
         status      :  'REGISTERED',
         cs_merchant_id : cs_merchant_id,
         terminal_id : terminalId
       };
       await dbq.updateTid(tidParams);
       //creating a seed entry for mypay_users_cardstream_settings table, 
       //otherwise 'sync script' will have to hardcode some of its column value while inserting (like signature/currencycode/countrycode)
       const csSettingsParams = {
         cs_merchant_id: cs_merchant_id,
         cs_signature_key: CS_SECURITY_KEY,
         country_code: CS_NUMERIC_COUNTRY_CODE,
         currency_code: CS_NUMERIC_CURRENCY_CODE
       }
       await dbq.seedUsersCardstreamSettings(csSettingsParams);
      let response = {
        data: {
          customer_id: cs_customer_id,
          merchant_id: cs_merchant_id
        }
      };
      return helpers.LambdaHttpResponse2(200, response, headers);



  }catch (e) {
    console.log('failed to create clients', e.message);
    //revert the creation of cardstream customer and merchant id
    let deleteCsCustomerResponse = cs_customer_id ? await mypayHelpers.deleteCsCustomer(cs_customer_id, MODE) : "No customer_id created";
    console.log('deleteCsCustomerResponse', deleteCsCustomerResponse);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
};



module.exports.createMerchant = async (event) =>{
  try {
    let MODE = process.env.MODE;

    const cs_customer_id = event.pathParameters.customer_id;
    const payload = JSON.parse(event.body);

    await mypayCreateMerchantPayloadSchema.validateAsync(payload);

    let terminalId = await validateTerminalId(payload.tid);
    if (terminalId) {
      terminalId = terminalId.tid
    }

    const merchant_prams = {
      merchantName: payload.merchantName,
      url: payload.url,
      testMode: payload.testMode,
      threeDSEnabled: payload.threeDSEnabled,
      threeDSRequired: payload.threeDSEnabled,
      acquirerBankName: payload.acquirerBankName,
      processorMerchantID: `${payload.processorMerchantID}-${terminalId}`,
      notifyEmail: payload.contactEmail,
      processorID: payload.processorID,
      securityKey: CS_SECURITY_KEY,
      status: payload.status || CS_STATUS,
      supportedCurrencies: payload.supportedCurrencies || CS_SUPPORTED_CURRENCIES,
      sotEnabled: CS_SOT_ENABLED,
      ipAddresses: CS_IP_ADDR,
      supportedCardTypes: CS_SUPPORTED_CARD_TYPES,
      acceptedCardTypes: CS_ACCEPTED_CARD_TYPES,
      threeDSCheckPref : CS_3D_CHECK_PREF
    };

      const cs_merchant_id = await mypayHelpers.csCreateMerchant(merchant_prams, cs_customer_id, MODE);

      const tidParams ={
        status      : 'REGISTERED',
        cs_merchant_id : cs_merchant_id,
        terminal_id : terminalId
      };
      await dbq.updateTid(tidParams);

      let api_response = {
        data: {
          merchant_id: cs_merchant_id
        }
      };
      return helpers.LambdaHttpResponse2(200, api_response, headers);

  }catch (e) {
    console.log('failed to create merchant', e.message);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers)
  }
};
let validateTerminalId = async (terminal_id = "") => {

  if(!terminal_id){
    //pick one unused terminal id from db
    terminal_id = await dbq.getTid({
      status  : 'NEW'
    });
    if(!terminal_id){
      throw ({"message":"Terminal id not available"});
    }
    //mark the entry as used
  }else{
    terminal_id = await dbq.getTid({
      status  : 'NEW',
      tid  : terminal_id
    });
    if(!terminal_id){
      throw ({"message":"Invalid terminal id given"});
    }
  }
  return terminal_id
};

let changeFlagFormat = (string)=>{
  if (string === ""){
    return false;
  }
  if(string === "YES" || string === "Y"){
    return "Y"
  }
  if(string === "NO" || string === "N"){
    return "N"
  }
}