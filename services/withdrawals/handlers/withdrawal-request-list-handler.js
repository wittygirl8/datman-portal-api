const helpers = require('../../../library/helpers')
const dbq = require('../dbq')
const moment = require("moment")


const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}
module.exports.withdrawalRequestList = async (event) => {
  try {

    const authoriserPayload = JSON.parse(event.requestContext.authorizer.payload);
    
    const payload = JSON.parse(event.body);

    const params = {
      customerId: authoriserPayload.merchant_id,
      month: payload.month,
      year: payload.year
    };
    //getting withdrawals not batched
    const startDate = moment.tz(moment(`${params.year}-${params.month}-01`, 'YYYY-MM-DD').subtract(1, 'day').startOf('week').add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),process.env.DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss');
    const endDate = moment.tz(moment(`${params.year}-${params.month}-01`, 'YYYY-MM-DD').endOf('month').format('YYYY-MM-DD HH:mm:ss'),process.env.DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')
    let notInBatch = await dbq.cardPaymentWithdrawal({ ...params , startDate: startDate, endDate: endDate})
    
    notInBatch = await Promise.all(notInBatch.map(async (record) => {
      return {
        ...record.dataValues,
        time : moment.tz(record.dataValues["time"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss")
      }
    }))
    //getting withdrawals which are batched
    let batch = await dbq.getBatch(params)
    let inBatch = await Promise.all(batch.map(async (itu) => {
      let batch_items_list = await dbq.getBatchItems(itu.batch_id)

      let batch_items = await Promise.all(batch_items_list.map(async (batch_item) => {
        let payment = await dbq.getPaymentMethod(batch_item.card_payment_id);
        batch_item.dataValues["method"] = payment.dataValues.method
        return batch_item;

      }))

      return {
        ...itu.dataValues,
        account_number: itu.dataValues['account_number'] ? helpers.maskWithStar(itu.dataValues['account_number'],4) : null,
        sort_code: itu.dataValues['sort_code'] ? helpers.maskWithStar(itu.dataValues['sort_code'],4) : null,
        date_pending : moment.tz(itu.dataValues["date_pending"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        date_sent : moment.tz(itu.dataValues["date_sent"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        batch_items
      }
    }))
    let payoutTransactionInfo = await dbq.getPayoutTransaction({
      merchant_id: authoriserPayload.merchant_id,
      month: payload.month,
      year: payload.year
    })
    
    let payoutTransaction = [];
    payoutTransaction.push(
      {
        provider: "DATMAN",
        transaction_data: {
          not_in_batch: notInBatch,
          in_batch: inBatch
        }
      });
    
    let payoutBatch = await dbq.getPayoutBatch(params);
    let batchIds = payoutBatch.map((batch) => batch.batch_id)
    let payoutbatchItems = await dbq.getPayoutBatchItems(batchIds)
    let paymentIds = payoutbatchItems.map((payoutsBatchItem) => payoutsBatchItem.card_payment_id)
    let payments = await dbq.getPayments({ paymentIds })

    let inBatchPayoutTransaction = payoutBatch.map((itu) => {
      let batch_items = JSON.parse(JSON.stringify(payoutbatchItems.filter((payoutItem) => payoutItem.batch_id === itu.batch_id)))
      batch_items = batch_items.map((batchItem) => {
        const payment = payments.filter((payment) => payment.id === batchItem.card_payment_id)
        return {
          ...batchItem,
          transaction_time:  moment.tz(payment[0].dataValues["transaction_time"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        }
      })
      return {
        ...itu.dataValues,
        account_number: itu.dataValues['account_number'] ? helpers.maskWithStar(itu.dataValues['account_number'],4) : null,
        sort_code: itu.dataValues['sort_code'] ? helpers.maskWithStar(itu.dataValues['sort_code'],4) : null,
        date_pending : moment.tz(itu.dataValues["date_pending"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        date_sent : moment.tz(itu.dataValues["date_sent"], process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss"),
        batch_items
      }
    })

    payoutTransaction.push({
      provider: "CARDSTREAM-CH",
      transaction_data: {
        in_batch: inBatchPayoutTransaction,
      },
    });

    for (let payout of payoutTransactionInfo) {
      let amount_in_decimals = payout.amount / 100;
      const data = {
        provider: payout.payment_provider,
        transaction_data: {
          amount: parseFloat((amount_in_decimals).toFixed(2)),
          currency: payout.currency,
          status: payout.status,
          expected_date: payout.expected_date
        }
      }
      payoutTransaction.push(data);
    }
    
    console.log('transaction', payoutTransaction)
    const response = {
      data: payoutTransaction
    }

    return helpers.LambdaHttpResponse2(200, response, headers)
  }
  catch (e) {
    console.log('CRASHED', e)
    return helpers.LambdaHttpResponse2(400, { message: e }, headers)

  }
}