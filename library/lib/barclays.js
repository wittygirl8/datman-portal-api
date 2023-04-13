const soap = require('soap');
let request = require("request");

module.exports.refund = (transaction) => {

    let system = 'live';
    let refund_amount = `${(transaction.total * 100)}`

    let url = `https://pal-${system}.barclaycardsmartpay.com/pal/Payment.wsdl`
    let options = {
        location: `https://pal-${system}.barclaycardsmartpay.com/pal/servlet/soap/Payment`,
        trace: 1,
        soap_version: 1,
        style: 2,
        encoding: 2
    }

    let args = {
        modificationRequest: {
            merchantAccount: 'DatManCOM',
            modificationAmount: {
                currency: 'GBP',
                value: refund_amount
            },
            originalReference: transaction.CrossReference
        }
    }

    return new Promise((resolve, reject)=>{
        soap.createClient(url, options, function (err, client) {
            client.setSecurity(new soap.BasicAuthSecurity('ws@Company.DatMan', 'd@tm@n#1'));
            client.refund(args, function (err, result) {
                if(err) {
                    console.log("err_dudu", err);
                    return reject(err)
                }
                
                console.log("result_dudu", result);
                resolve(result)
            });
        });
    })

}
