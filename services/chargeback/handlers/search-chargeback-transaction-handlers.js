const { chargeBackTransactionSchema } = require("../../../library/helpers/schema");
const helpers = require("../../../library/helpers");
const { getChargeBackTxn } = require("../dbq");
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}
module.exports.searchChargeBackTransactions = async (event) => {
  try {
    let payload = JSON.parse(event.body);

    await chargeBackTransactionSchema.validateAsync(payload);
    const payloadDate = payload.date.split('/');

    const params = {
      day: payloadDate[0],
      month: payloadDate[1],
      year: payloadDate[2],
      total: payload.amount
    }
    const txnChargeBack = await getChargeBackTxn(params);
    
    const chargebacks = txnChargeBack.map(chargeback =>{
        return {
          merchant_id : chargeback.customer_id,
          created_at: chargeback.date,
          amount: chargeback.total,
          payment_provider: chargeback.payment_provider,
          payment_status : chargeback.payment_status,
          cross_reference : chargeback.CrossReference,
          last_4_digits :chargeback.last_4_digits ,
          tx_auth_no : chargeback.TxAuthNo,
          firstname : chargeback.firstname,
          address : chargeback.address,
          charge_back_exists : !!chargeback.id,
          transaction_id : chargeback.chargeback_id,
          cb_reason: chargeback.reason,
          comments: chargeback.comments,
          outcome: chargeback.outcome,
          telephone: chargeback.tel
        }
    });
    const response = {
      chargebacks
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("CRASHED", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

