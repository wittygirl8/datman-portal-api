const {chargeBack,chargeBackYearlyData} = require("../dbq");
const moment = require("moment-timezone");
const { listChargeBackPaylaodSchema } = require("../../../library/helpers/schema");
const helpers = require("../../../library/helpers");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
module.exports.chargeBackList = async (event) => {
  let params;
  try {
    let payload = JSON.parse(event.body);
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let merchantId = authoriserPayload.merchant_id;
    console.log('authoriserPayload', authoriserPayload)
    await listChargeBackPaylaodSchema.validateAsync(payload);
    params = {
      ...payload,
      merchantId,
    };
   
    if(
      (authoriserPayload.scopes && authoriserPayload.scopes !== 'Admin' )
      &&
      (!payload.year || !payload.month)
    ){
      throw {message: "Required parameters missing (year,month)"}
    }

    //if year/month available, get the data based on month/year
    if(payload.year && payload.month){
      let chargeBacksInfo = await chargeBack(params);
      let chargeBacks = await getChargeBacks(chargeBacksInfo);
      let response = {data: chargeBacks,};
      return helpers.LambdaHttpResponse2(200, response, headers);
    }

    //get the last year data for Admin when there is no payload at all
    const chargeBacksYearlyInfo = await chargeBackYearlyData(params);
    const chargeBacks = await getChargeBacks(chargeBacksYearlyInfo);
    let response = {
      data: chargeBacks,
    };
    return helpers.LambdaHttpResponse2(200, response, headers);
    
  } catch (e) {
    console.log("CRASHED chargeBack", e);
    return helpers.LambdaHttpResponse2(400, { message: e }, headers);
  }
};

const getChargeBacks = async(chargeBacks) =>{
  return chargeBacks.map( (record) => {
    return {
     ...record,
      time : moment.tz(record.time, process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
    }});
}