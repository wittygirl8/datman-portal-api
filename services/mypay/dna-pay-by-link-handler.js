/** @format */

const dbq = require("./dbq");
const { v4: uuidv4 } = require("uuid");

var axios = require("axios");
var FormData = require("form-data");

var moment = require("moment-timezone");

module.exports.main = async (event, context, callback) => {
  console.log("Webhook URL ", `${process.env.DNA_WEBHOOK_URL}/dna/webhook`);

  async function generateOrderId() {
    const hexString = Array(8)
      .fill()
      .map(() => Math.round(Math.random() * 0xf).toString(8))
      .join("");
    let randomBigInt = BigInt(`0x${hexString}`)
      .toString()
      .replace("n", "")
      .substring(0, 11);
    console.log({ randomBigInt });
    let isOrderIdAvailable = await dbq.checkForOrderId(randomBigInt);
    console.log({ isOrderIdAvailable });
    if (isOrderIdAvailable) {
      generateOrderId();
    }
    return randomBigInt;
  }

  try {
    context.callbackWaitsForEmptyEventLoop = false;
    let authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    let merchant_id = authoriserPayload.merchant_id;
    let payload = event.queryStringParameters;

    console.log({ payload });

    // mocks for local testing
    // let payload = {
    //   amount: 13,
    //   currency_code: "826",
    // };
    // let merchant_id = "63184000";

    let autoAssignedOrderRef = await generateOrderId();

    console.log("Order Id / Invoice Id ", autoAssignedOrderRef);

    const transactionData = await dbq.createAutoSettlingTransaction({
      ...payload,
      payment_provider: "DNA",
      origin: "HOSTED-FORM",
      order_id: autoAssignedOrderRef,
      payment_status: "PENDING",
      merchant_id,
    });

    const transactionId = transactionData.id;

    let invoiceId = "T" + transactionId + "O" + autoAssignedOrderRef + "M" + merchant_id;

    let invoiceIdDna = payload.description ? payload.description+" #AO"+ invoiceId : invoiceId;
  
    console.log({ invoiceIdDna });

    const apiData = {
      url: `${process.env.BIFROST_ENDPOINTS}/api/v1/bifrost/get-dna-merchant-metadata/${merchant_id}`,
      method: "get",
      headers: {
        api_token: process.env.BIFROST_API_TOKEN,
      },
    };
    let bifrost_response = await axios(apiData);
    let dnaTerminalData = bifrost_response.data;
    console.log("DNA terminal data", dnaTerminalData);

    let currentDate = moment().tz("europe/london");
    let tempDate = currentDate.clone();
    let expiryDate = tempDate.add(2, "days").format("YYYY-MM-DDTHH:mm:ss[Z]");
    
    console.log(`Printing currentDate~`, currentDate);
    console.log(`Printing expiryDate~`, expiryDate);

    let dnaAuthObject = {
      amount: payload.amount,
      description:'',
      invoiceIdDna: invoiceIdDna,
      webhookUrl: `${process.env.DNA_WEBHOOK_URL}/dna/webhook`,
      returnUrl: process.env.DNA_RETURN_URL,
      terminalId: dnaTerminalData.terminalId,
      clientSecret: process.env.DNA_CLIENT_SECRET,
      scope: process.env.DNA_SCOPE,
      clientId: process.env.DNA_CLIENT_ID,
      authUrl: process.env.DNA_AUTH_URL,
      sdkUrl: process.env.DNA_SDK_URL,
      isTestMode: process.env.DNA_IS_TEST_MODE,
      expirationDate: expiryDate,
      callbackUrl: `${process.env.DNA_WEBHOOK_URL}/dna/webhook`,
      failureReturnUrl: process.env.DNA_RETURN_URL,
      failureCallbackUrl: `${process.env.DNA_WEBHOOK_URL}/dna/webhook`
    };

    let dnaAuthResponse = await dnaAuth(dnaAuthObject);

    console.log({ dnaAuthResponse });

    if (!dnaAuthResponse) throw "dnaAuthResponse is undefined";

    let dnaCreateLinkResponse = await createDnaPaymentLink(dnaAuthResponse, dnaAuthObject);

    console.log(dnaCreateLinkResponse);

    if(!dnaCreateLinkResponse) {
      throw "Unable to process your request"
    }

    const uuid = uuidv4();

    console.log("New uuid ", uuid);

    await dbq.capturePaybyLinkData({
      uuid,
      pay_by_link_details: JSON.stringify(dnaCreateLinkResponse),
    });

    let body = JSON.stringify({
      status: true,
      data: {
        uuid,
        invoice_id: invoiceIdDna
      },
      message: "lets do the payment...",
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
        "Access-Control-Allow-Origin": "*",
      },
      body,
    };
  } catch (e) {
    console.log({ e });
    return {
      statusCode: 400,
      body: JSON.stringify({
        status: false,
        message: e,
      }),
    };
  }

  // return {
  //   statusCode: 301,
  //   headers: {
  //     "Content-Type": "text/html",
  //   },
  //   body: await dnahostedFormContent(dnaAuthResponse, dnaAuthObject),
  // };
};

let dnaAuth = async (obj) => {
  var data = new FormData();
  data.append("scope", obj.scope);
  data.append("grant_type", "client_credentials");
  data.append("invoiceId", obj.invoiceIdDna);
  data.append("amount", obj.amount);
  data.append("currency", "GBP");
  data.append("description", obj.description);
  // below will be fetched env
  data.append("client_secret", obj.clientSecret);
  data.append("terminal", obj.terminalId);
  data.append("client_id", obj.clientId);
  // data.append(
  //   "client_secret",
  //   "=7aGwhVJjtlZdmg6_wQOolaEe612wWxtA_qNQ*cnP8a4NedJNgxG--BxIDw0Urj4"
  // );
  // data.append("terminal", "24b25f01-5182-4e4b-ac55-16ab30a6bed5");
  // data.append("client_id", "foodhub");

  var config = {
    method: "post",
    url: obj.authUrl,
    headers: {
      ...data.getHeaders(),
    },
    data: data,
  };
  let response = await axios(config);

  console.log({ response });

  return response.data;
};

let createDnaPaymentLink = async (dnaAuthResponse, dnaAuthObject) => {

console.log("Inside the createDnaPaymentLink",dnaAuthResponse,dnaAuthObject);

var data = JSON.stringify({
  "amount": parseFloat(dnaAuthObject.amount),
  "currency": "GBP",
  "invoiceId": dnaAuthObject.invoiceIdDna,
  "terminalId": dnaAuthObject.terminalId,
  "expirationDate": dnaAuthObject.expirationDate,
  "customerName": dnaAuthObject.customerName|| 'NA',
  "description": dnaAuthObject.description,
  "paymentSettings": {
    "callbackUrl": `${process.env.DNA_WEBHOOK_URL}/dna/webhook`,
    "failureReturnUrl": process.env.DNA_RETURN_URL,
    "failureCallbackUrl": `${process.env.DNA_WEBHOOK_URL}/dna/webhook`
  }
});

console.log("Printing the data", data);

var config = {
  method: 'post',
  url: `${process.env.DNA_API_URL}/payment-links`,
  headers: { 
    'Authorization': `Bearer ${dnaAuthResponse.access_token}`, 
    'Content-Type': 'application/json'
  },
  data : data
};

console.log('Printing config data', config);

let dnaLinkDetails = await axios(config);
return dnaLinkDetails.data;
};
