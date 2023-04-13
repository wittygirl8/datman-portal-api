const dbq = require("./dbq");
const helpers = require("../../library/helpers");
const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
};
module.exports.main = async (event, context, callback) => {
  let payload = JSON.parse(event.body);
  console.log("Payload on Webhook ", payload);

  invoiceId = payload.invoiceId.split('#').pop();
  console.log("InvoiceId",invoiceId);
  const extracted_order_id = invoiceId.slice(invoiceId.lastIndexOf("O")+1, invoiceId.lastIndexOf("M"));
  console.log("ExtractedOrderId",extracted_order_id);

  //signature has to auth
  //authentication

  console.log("Saving Dna Webhook Response in DB",event.body,extracted_order_id);

  let savedResponse = await dbq.saveDnaResponse(event.body, extracted_order_id);

  console.log("Saved Dna Webhook Response and upding transaction status in DB", extracted_order_id, savedResponse);

  let updateResponse = await dbq.updateAutoSettlingTransaction({
    ...payload,
    order_id: extracted_order_id,
    payment_status: 'OK'
  });

  console.log("Updated transaction status returning status 200 now.", updateResponse);

  //save dna response into 1 table

  return helpers.LambdaHttpResponse2(200, {}, headers);
};
