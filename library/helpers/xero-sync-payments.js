const { XeroClient } = require('xero-node');
var axios = require('axios');
const clientId = 'AD3C4A825B9D44DAAAD178B1F6FD22B4';
const clientSecret = 'sCUM9mBTwxn6443YTdcFv94rCxCtV-HgABkd8EDxBgQRTR_T';
const scope = 'accounting.transactions accounting.settings accounting.contacts';
const summarizeErrors = true;
const unitdp = 2;
const xeroTenantId = 'c028f521-418c-4e1d-96d4-c608f784f15d';
const accountCode = '1234567';
const contactId = 'beb646bc-d50f-4ff7-aeaf-11b2e62837e1';
const bankAccountId = 'bd6ed74c-e5d3-4aa7-ae13-d4bd56eab2e8';
const base64 = require('base-64');
var qs = require('qs');

const xero = new XeroClient({
    clientId: clientId,
    clientSecret: clientSecret,
    redirectUris: [`https://developer.xero.com`],
    scopes: scope.split(' ')
});

const genrerateAccessToken = async () => {
    var token = base64.encode(`${clientId}:${clientSecret}`);
    var data = qs.stringify({
        grant_type: 'client_credentials',
        scope: scope
    });

    const config = {
        method: 'post',
        url: 'https://identity.xero.com/connect/token',
        headers: {
            Authorization: `Basic ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
    };

    const res = await axios(config);
    console.log('xero auth response: ', res);
    await xero.setTokenSet(res.data);
};

module.exports.syncTransactionsToXero = async (payment) => {
    console.log('reached here to sync to xero');
    const { amount, transactionDate, transactionReference, type } = payment;
    const itemQuantity = 1;

    const contact = {
        contactID: contactId
    };

    const lineItem = {
        //description: 'vale furnish',
        quantity: itemQuantity,
        unitAmount: amount,
        accountCode: accountCode,
        isReconciled: false
    };

    const bankAccount = {
        accountID: bankAccountId
    };

    const lineItems = [];
    lineItems.push(lineItem);

    const paymentObj = {
        type: type,
        contact: contact,
        date: transactionDate,
        lineItems: lineItems,
        bankAccount: bankAccount,
        isReconciled: true,
        reference: transactionReference
    };
    const bankTransactions = {
        bankTransactions: [paymentObj]
    };

    console.log('xero payment object', JSON.stringify(bankTransactions));

    try {
        await genrerateAccessToken();
        const response = await xero.accountingApi.createBankTransactions(
            xeroTenantId,
            bankTransactions,
            summarizeErrors,
            unitdp
        );
        console.log(response.body || response.response.statusCode);
    } catch (err) {
        const error = JSON.stringify(err.response.body, null, 2);
        console.log(`Status Code: ${err.response.statusCode} => ${error}`);
    }
};
