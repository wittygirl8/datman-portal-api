const helpers = require("../../../library/helpers");
const schema = require('../../../library/helpers/schema')
const dbq = require("../dbq");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};

module.exports.main = async (event) => {

  try {
    const payload = JSON.parse(event.body);
    console.log('payload', payload);
    await schema.paymentFeeDetails.validateAsync(payload);
    let FeeArray = [];

    let FeeInfo = await dbq.GetTxnFeeInfo(payload)
    console.log({FeeInfo})

    if(!FeeInfo){
      throw { message: "Txn not found!" };
    }

    let DatmanFee = parseFloat(FeeInfo.fees);
    
    //now check if there is split commission associated with this txn
    let SplitFeeInfo = await dbq.GetSplitTxnFeeInfo({
      payment_id : payload.payment_id
    })
    console.log({SplitFeeInfo})
    
    if(SplitFeeInfo.length > 0){
      SplitFeeInfo.forEach((SplitFeeItem)=>{
        DatmanFee -= parseFloat(SplitFeeItem.amount)
        FeeArray.push({
          "fee_description": SplitFeeItem.commission_type,
          "fee_amount": parseFloat(SplitFeeItem.amount).toFixed(2),
          "fee_partner_name": SplitFeeItem.parter_name,
        })
      })
    }


    FeeArray.push({
      "fee_description": "Datman Fees",
      "fee_amount": DatmanFee.toFixed(2),
      "fee_partner_name": 'DATMAN Ltd',
    })

    let response = {
      data: FeeArray
    };
  
    return helpers.LambdaHttpResponse2(200, response, headers);
  } catch (e) {
    console.log("Main Exceptionn", e.message);
    return helpers.LambdaHttpResponse2(400, { message: e.message }, headers);
  }
};
