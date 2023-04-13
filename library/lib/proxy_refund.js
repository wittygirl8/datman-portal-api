var request = require("request");



module.exports.proxyRefund = (params) => {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'POST',
            // url: 'http://3.65.204.184/api2.php?action=refund',
            url: 'http://legacy-migration.datmanpay.com/api2.php?action=refund',
            //url: 'https://sandbox.gateway.datmanpay.com/api.php?action=refund',
            headers:
            {
                api_token: "4HfhV2aYtUp7fwbonPM0gXPFUJ4PF98Q4fi"
                // api_token: ""
                // 'cache-control': 'no-cache'
            },
            body: params,
            json: true
        };


        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                console.log('proxy refund error: ', body);
                return reject(error)
            }
            console.log("proxy refund success: ", body);
            resolve(body)
        });

    })
}

