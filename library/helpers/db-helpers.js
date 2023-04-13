const helpers = require("../helpers");
module.exports.checkAccountBalance = async (params) => {
    console.log('params inside',params)
    let paymentDbq = require('../../services/payments/dbq')
    // calculate is current account balance
    /**
     * following below are sequlize ORM queries 
     * no need to parse via keys
     */
    // 1. total cardpayment
    let cardPaymentSum = await paymentDbq.cardPaymentSum(params)
    // 2. total amount of internal transfer the client has done
    let itDoneByClient = await paymentDbq.itDoneByClient(params)
    // 3. total amount of internal transfer the client has received
    let itRecievedByClient = await paymentDbq.itRecievedByClient(params)
    /**
     * following below are RAW queries
     * need to parse
     */

    // 4. total refund the client has received from suppliers
    let rawItClientRecievedFromSuppliers = await paymentDbq.itClientRecievedFromSuppliers(params)
    let itClientRecievedFromSuppliers = rawItClientRecievedFromSuppliers[0][0]['total']
    if (!itClientRecievedFromSuppliers) {
        itClientRecievedFromSuppliers = 0
    }
    // 5. toal refund the client has given to suppliers
    let rawRefundGivenToSuppliers = await paymentDbq.refundGivenToSuppliers(params)
    let refundGivenToSuppliers = rawRefundGivenToSuppliers[0][0]['total']
    if (!refundGivenToSuppliers) {
        refundGivenToSuppliers = 0
    }
    //6. Transactions from payments table
    let payments_table_balance = await paymentDbq.getPaymentsBalanceSum(params)
    payments_table_balance = parseFloat(helpers.formatCurrency(payments_table_balance[0].dataValues.sum));
    console.log({payments_table_balance})

    console.log("cardPaymentSum",cardPaymentSum) 
    console.log("itDoneByClient",itDoneByClient) 
    console.log("itRecievedByClient",itRecievedByClient) 
    console.log("itClientRecievedFromSuppliers",itClientRecievedFromSuppliers) 
    console.log("refundGivenToSuppliers",refundGivenToSuppliers)
    console.log("payments_table_balance",payments_table_balance) 
    // balance = 1 - 2 + 3 + 4 - 5
        let avaliablebBalance =
            (cardPaymentSum + payments_table_balance) -
            itDoneByClient +
            itRecievedByClient +
            itClientRecievedFromSuppliers -
            refundGivenToSuppliers

        // Round Down 
       let balance = helpers.formatCurrency(avaliablebBalance)

    
    console.log("avaliablebBalance", (balance))
    return {
        balance
    }
    
}

module.exports.GetAvailableBalance = async (params,balance) => {
    console.log('params inside GetAvailableBalance ',params)
    let paymentDbq = require('../../services/payments/dbq')
    let balance_transit = 0.00;
    let available_balance = 0.00;

    balance_transit = await paymentDbq.getPaymentsBalanceTransitSum(params)
    balance_transit = helpers.formatCurrency(balance_transit[0].dataValues.sum)
    available_balance = parseFloat(balance) - parseFloat(balance_transit)
    available_balance = helpers.formatCurrency(available_balance);   
    return {
        balance, balance_transit, available_balance
    }
}