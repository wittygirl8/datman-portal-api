const soap = require('soap');
let request = require("request");

module.exports.refund = (params) => {

    let newVendorTxCode = 'REF' + (params.VendorTxCode).substring(0, -3)

    let data = {
        VPSProtocol: '2.23',
        TxType: 'REFUND',
        Vendor: 'takeawaypos',
        VendorTxCode: newVendorTxCode,
        // VPSTxId : transaction.VPSTxId,
        Amount: params.amount,
        Description: params.reason,
        Currency: 'GBP',
        RelatedVPSTxId: params.VPSTxId,
        RelatedVendorTxCode: params.VendorTxCode,
        RelatedSecurityKey: params.SecurityKey,
        RelatedTxAuthNo: params.TxAuthNo
    }
    console.log("sagedata", data)

    return new Promise((resolve, reject) => {

        let options = {
            method: 'POST',
            url: 'https://live.sagepay.com/gateway/service/refund.vsp',
            form: data
        }
        request(options, function (err, resp, body) {
            // console.log(resp)
            // console.log(body)
            // console.log(data)

            // Parse body 
            let parts = body.split("\r\n")
            console.log('parts', parts)
            let obj = {}

            // create a json key value pair
            parts.map((element) => {
                let kv = element.split('=')
                obj[kv[0]] = kv[1]
            })

            // in addition to parsing the value, deal with possible errors
            if (err || resp.statusCode != 200) {

                console.log("err")
                return reject(err);
            }
            //check the status key it not OK
            if (obj['Status'] != 'OK') {
                console.log('sagePay status is not OK')
                return reject(obj)
            }
            resolve(obj)

        });

    })

}