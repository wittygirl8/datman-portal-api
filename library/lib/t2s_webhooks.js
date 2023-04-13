var request = require("request");



module.exports.updateT2sOrder = (amount, order_info_id) => {
    return new Promise((resolve, reject) => {
        var options = {
            method: 'POST',
            url: 'https://api.touch2success.com/hook/confirm',
            headers:
            {
                token: 'ZU8D4luUBAyXuGnGZxCTiSG8zIA7U3pojEjMNBYtCJT8HABWhz1Ocp0JZGFHJCT2S',
                'cache-control': 'no-cache'
            },
            formData: { order_info_id, amount }
        };
        console.log('orderid and amount', order_info_id, amount)

        request(options, function (error, response, body) {
            if (error || response.statusCode != 200){
                console.log('t2s webhook error: ',body);
                return reject(error)
            }
            console.log("t2s webhook success: ",body);
            resolve(body)            
        });

    })
}

