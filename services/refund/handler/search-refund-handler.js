const dbq = require("../dbq");
const schema = require("../../../library/helpers/schema");
const helpers = require("../../../library/helpers");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

const PAYMENT_PROVIDERS_TYPES = {
  OPTOMANY: 'OPTOMANY',
  JUDOPAY: 'JUDOPAY',
  BARCLAYS: 'BARCLAYS',
  SAGEPAY: 'SAGEPAY'
};

module.exports.searchRefund = async (event) => {
  
  try {
    let payload = JSON.parse(event.body);
    await schema.searchRefundSchema.validateAsync(payload);
    
    let refundResults = await dbq.searchRefund(payload);
    console.log('refundResults', refundResults);
    refundResults = refundResults.map(refund =>{
      const cross_reference = refund.VendorTxCode || refund.CrossReference;
      return {
        payment_id: refund.id,
        merchant_id: refund.customer_id,
        business_name: refund.business_name,
        cross_reference:  cross_reference,
        customer_firstname: refund.firstname,
        customer_lastname: refund.lastname,
        address : refund.address,
        refund_reason : refund.refund,
        time: refund.time,
        payment_provider: refund.payment_provider,
        payment_provider_mms_link : getPaymentProviderMmsLink(refund.payment_provider,cross_reference),
        refund_processed_status: refund.refund_processed_status
      }
    })
   

    
   
    let response = {
      data: refundResults,
    };
    return helpers.LambdaHttpResponse2(200, response, headers);

  } catch (e) {
    console.log("CRASHED chargeBack", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

const getPaymentProviderMmsLink = (payment_provider,cross_reference) =>{
  switch(payment_provider){
    case PAYMENT_PROVIDERS_TYPES.OPTOMANY :
      return `https://occ.optomany.com/Reporting/Criteria/Search?id=${encodeURI(cross_reference)}`;
    case PAYMENT_PROVIDERS_TYPES.JUDOPAY :
      return `https://portal.judopay.com/payments/detail/${encodeURI(cross_reference)}`;
    case PAYMENT_PROVIDERS_TYPES.BARCLAYS :
      return `https://ca-live.barclaycardsmartpay.com/ca/ca/accounts/showTx.shtml?pspReference=${encodeURI(cross_reference)}`;
    case PAYMENT_PROVIDERS_TYPES.SAGEPAY :
      return `https://live.sagepay.com/mysagepay/transactiondetail.msp?transactionID=${encodeURI(cross_reference)}`;
    default :
      return `https://ca-live.barclaycardsmartpay.com/ca/ca/accounts/showTx.shtml?pspReference=${encodeURI(cross_reference)}`;

  }
}

