const dbq = require("./dbq");

module.exports.dnaRedirectHandler = async (event, context, callback) => {
  console.log({event});

  try {

  context.callbackWaitsForEmptyEventLoop = false;

  const uuid = event.pathParameters.uuid;
  // console.log({uuid});

  const response = await dbq.getHostedForm({uuid});

  const { invoice_expiry_date } = response;

  if(invoice_expiry_date){

    const expiryDate = new Date(invoice_expiry_date);
    const today = new Date();

    const isExpiryToday =
        expiryDate.getDay() == today.getDay() &&
        expiryDate.getMonth() == today.getMonth() &&
        expiryDate.getFullYear() == today.getFullYear();

    if (today > expiryDate && !isExpiryToday) {
        throw 'Invoice Expiry Passed!';
    }

  }

  // console.log("Dna",response);

  return {
    statusCode: 301,
    headers: {
      Location: JSON.parse(response.pay_by_link_details).url
    }    
  };
}
catch(e)
{
  return {
    statusCode: 400,
    body: { 
      status: false,
      message :JSON.stringify(e)
    }
  };
}
};
