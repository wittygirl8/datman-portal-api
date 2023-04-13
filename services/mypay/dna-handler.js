/** @format */

const dbq = require("./dbq");
const { v4: uuidv4 } = require("uuid");

var axios = require("axios");
var FormData = require("form-data");
var moment = require("moment-timezone");
var currentDate = moment().tz("europe/london");

module.exports.main = async (event, context, callback) => {
    console.log(
        "Webhook URL ",
        `${process.env.DNA_WEBHOOK_URL}/portal/dna-webhook`
    );

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
        let authoriserPayload = JSON.parse(
            event.requestContext.authorizer.payload
        );
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

        let invoiceId =
            "T" +
            transactionId +
            "O" +
            autoAssignedOrderRef +
            "M" +
            merchant_id;

        let invoiceIdDna = payload.description
            ? payload.description + " #AO" + invoiceId
            : invoiceId;

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
        let expiryDate = JSON.stringify(
            `${currentDate.add(2, "days").format("YYYY-MM-DDTHH:mm:SSS[Z]")}`
        );
        console.log(`Printing currentDate~`, currentDate);
        console.log(`Printing expiryDate~`, expiryDate);

        let dnaAuthObject = {
            amount: payload.amount,
            description: "",
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
        };

        // Auth DNA
        let dnaAuthResponse = await dnaAuth(dnaAuthObject);

        console.log({ dnaAuthResponse });

        if (!dnaAuthResponse) throw "dnaAuthResponse is undefined";

        let dnaForm = await dnahostedFormContent(
            dnaAuthResponse,
            dnaAuthObject
        );

        console.log({ dnaForm });

        const uuid = uuidv4();

        console.log("New uuid ", uuid);

        let payload_invoice_id = null;
        let payload_invoice_expiry_date = null;

        if (
            payload.hasOwnProperty("invoiceId") &&
            payload.invoiceId &&
            payload.invoiceExpiryDate
        ) {
            payload_invoice_id = "M" + merchant_id + "I" + payload.invoiceId;
            payload_invoice_expiry_date = payload.invoiceExpiryDate;
        }

        await dbq.createHostedFormEntry({
            uuid,
            html: dnaForm,
            invoice_id: payload_invoice_id,
            invoice_expiry_date: payload_invoice_expiry_date,
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

let dnahostedFormContent = async (dnaAuthResponse, dnaAuthObject) => {
    return `<html>
  <head>
    <title>DNA Test</title>
    <script src="${dnaAuthObject.sdkUrl}"></script>
  </head>
  <body>
    <div id="dna-embedded-widget-container"></div>
    <div class="customClassName"></div>
  </body>
  <script>
    let ACCESS_TOKEN = "${dnaAuthResponse.access_token}";
    let TERMINAL_ID = "${dnaAuthObject.terminalId}";
    let INVOICE_ID = "${dnaAuthObject.invoiceIdDna}";
    let DESCRIPTION = "${dnaAuthObject.description}";
    let WEBHOOK = "${dnaAuthObject.webhookUrl}";
    let RETURN_URL = "${dnaAuthObject.returnUrl}";
    let IS_TEST_MODE = ${dnaAuthObject.isTestMode};
    let EXPIRATION_DATE= ${dnaAuthObject.expirationDate}

    window.DNAPayments.configure({
      isTestMode: IS_TEST_MODE,
      isEnableDonation: true,
      paymentMethods: [
        {
          name: window.DNAPayments.paymentMethods.BankCard,
        },
        {
          name: window.DNAPayments.paymentMethods.PayPal,
          message: "NO FEE",
        },
      ],
      events: {
        opened: () => {
          console.log("Checkout opened");
        },
        cancelled: () => {
          console.log("Transaction cancelled");
        },
        paid: () => {
          window.DNAPayments.closePaymentWidget();
          console.log("Transaction successful");
        },
        declined: () => {
          console.log("Transaction declined");
          window.DNAPayments.closePaymentWidget();
        },
      },
    });

    window.DNAPayments.openPaymentPage({
      invoiceId: INVOICE_ID,
      currency: "GBP",
      description: DESCRIPTION,
      paymentSettings: {
        terminalId: TERMINAL_ID,
        returnUrl: RETURN_URL,
        failureReturnUrl: RETURN_URL,
        callbackUrl:WEBHOOK,
        failureCallbackUrl: WEBHOOK,
        expirationDate: EXPIRATION_DATE,
        sendCallbackEveryFailedAttempt : 1
      },
      customerDetails: {
        deliveryDetails: {
          deliveryAddressUsageIndicator: "04",
          deliveryIndicator: "01",
        },
      },
      email: "test@mypay.co.uk",
      amount: ${dnaAuthObject.amount},
      entryMode: 'mail-order',
      auth: {
        access_token: ACCESS_TOKEN,
        expires_in: 7200,
        scope: "payment integration_hosted",
        token_type: "Bearer"
      },
    });
  </script>
</html>`;
};
