
var crypto = require('crypto');
var dateFormat = require('dateformat');
var converter = require('number-to-words');
const generator = require('generate-password');
const jwt = require('jsonwebtoken')
var CryptoJS = require("crypto-js");

/**
 * Whenever custom_logger is imported make sure you import errorType as well
 */
module.exports.errorType = {
    "OK": 3,
    "WARNING": 2,
    "DANGER": 0
}

module.exports.custom_logger = (level, ...messages) => {
    if (level == null) {
        console.log("\x1b[32m", "Please provide the level, use errorType.< Type > to pass your level of error ")
    }

    if (level === this.errorType.DANGER) {

        messages.forEach(message => {
            console.error(message)
        });

    }

    else if (level == this.errorType.WARNING) {

        messages.forEach(message => {
            console.log('\x1b[33m', message);
        });

    }

    else {
        if (process.env.DEBUG_MODE == 'DEVELOPMENT' || true) {
            messages.forEach(message => {
                console.log('\x1b[33m', message);
            });
        }

    }

}

module.exports.decrypt = (encryptedMessage, encryptionMethod, secret, iv) => {
    var decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
    return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
    // return Buffer.concat([
    //     decryptor.update(encryptedMessage),
    //     decryptor.final()
    // ]);
};

module.exports.getSplitTransaction = (t) => {
    // T23235929O44596263M63156504C63156504
    let transactionId = t.substring(
        t.lastIndexOf("T") + 1,
        t.lastIndexOf("O")
    );
    let orderId = t.substring(
        t.lastIndexOf("O") + 1,
        t.lastIndexOf("M")
    );
    let merchantId = t.substring(
        t.lastIndexOf("M") + 1,
        t.lastIndexOf("C")
    );
    // let customerId = t.substring(
    //     t.lastIndexOf("C") + 1,
    //     t.substr(-1)
    // );

    let customerId = undefined
    return { transactionId, orderId, merchantId, customerId }
}

module.exports.getSplitApiKeys = (t) => {
    // let value = acct_A13P1T1U16R12345
    let account_id = t.substring(
        t.lastIndexOf("A") + 1,
        t.lastIndexOf("P")
    );
    let provider_id = t.substring(
        t.lastIndexOf("P") + 1,
        t.lastIndexOf("T")
    );
    let account_type = t.substring(
        t.lastIndexOf("T") + 1,
        t.lastIndexOf("U")
    );
    let user_id = t.substring(
        t.lastIndexOf("U") + 1,
        t.lastIndexOf("R")
    );

    return { account_id, provider_id, account_type, user_id }
}

module.exports.getCurrentAndNextTuesday = () => {
    var now = new Date();
    let fullDate = dateFormat(now, "dddd,mmmm,dd,yyyy,N").split(',');
    let numricWeek = fullDate[4]
    while (numricWeek != 2) {
        // now = new Date(now.getTime() +(24 * 60 * 60 * 1000))
        // now.setDate(now.getDate() + 1)
        fullDate = dateFormat(now.setDate(now.getDate() + 1), "dddd,mmmm,dd,yyyy,N").split(',')
        numricWeek = fullDate[4]
    }
    console.log('fullDate', fullDate)
    let nextTuesday = {
        day: fullDate[0],
        month: fullDate[1],
        date: converter.toWordsOrdinal(fullDate[2]),
        year: converter.toWords(fullDate[3])
    }
    fullDate = dateFormat(now.setDate(now.getDate() + 7), "dddd,mmmm,dd,yyyy,N").split(',')
    console.log('fullDate', fullDate)
    let nextToNextTuesday = {
        day: fullDate[0],
        month: fullDate[1],
        date: converter.toWordsOrdinal(fullDate[2]),
        year: converter.toWords(fullDate[3])
    }
    // console.log(nextTuesday, nextToNextTuesday)
    return { nextTuesday, nextToNextTuesday }
}

module.exports.feeCalculation = (amount, percent, adminFee) => {

    let a = parseFloat(amount)
    let p = parseFloat(percent)
    let af = parseFloat(adminFee)

    // let fee = parseFloat((amount * (percent / 100) + adminFee))
    let fee = (amount * (percent / 100)) + af
    console.log('fee calculation from helper', fee)
    return fee;
}

module.exports.LambdaHttpResponse = (statusCode, payload, callback) => {

    callback(null, {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*', // Required for CORS support to work
            'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
        },
        body: JSON.stringify(payload)
    })

}

module.exports.LambdaHttpResponse2 = (statusCode, payload, headers) => {
    let responseObject = {
        headers,
        statusCode,
        body: JSON.stringify(payload)
    }
    console.log('Provided object is', responseObject)
    return responseObject

}
module.exports.getAccountType = (type) => {
    if (type == 'END_USER') {
        return 1
    }
}

module.exports.testPromise = (message) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('hey this test promise is working')
            resolve({ message: "hey this message looks good" })
        }, 4000)
    })
}

/**
* Returns an IAM policy document for a given user and resource.
*
* @method buildIAMPolicy
* @param {String} userId - user id
* @param {String} effect  - Allow / Deny
* @param {String} resource - resource ARN
* @param {String} context - response context
* @returns {Object} policyDocument
*/
module.exports.buildIAMPolicy = (userId, effect, resource, context) => {
    const policy = {
        principalId: userId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource,
                },
            ],
        },
        context,
    };

    return policy;
};

module.exports.generatePassword = () => {
    let password_plain_text = generator.generate({
        length: 8,
        numbers: true,
        uppercase: false,
        excludeSimilarCharacters: true
    });

    return password_plain_text
}

module.exports.verifyJwt = (token, secret) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decode) => {
            if (err) {
                let response = {
                    status: "fail",
                    message: err.name,
                    err: err.message
                }
                reject(response)
            }
            resolve(decode)
        })

    })

}

module.exports.maskWithStar = (input, digits) => {
    // console.log(input.length)
    // let star = ''
    // for(i=0; i<= input.length - digits; i++){
    //     star += '*'
    // }
    // lastStrings = input.substr(input.length - digits)
    // console.log('str', star)
    // return star+lastStrings

    // let string = '23234342342'
    // var replace = "regex";
    // var re = new RegExp(/\d(?=\d{4})/g, "g");

    return input.replace(/\d(?=\d{3})/g, "*")

}

module.exports.formatCurrency = (value) => {
    const currency = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    // Round Down
    // value = Math.floor((value) * 100) / 100;


    return currency.format(value).replace(/,/g, '')
}

module.exports.number_format = (number, decimals, decPoint, thousandsSep) => { // eslint-disable-line camelcase
    //  discuss at: https://locutus.io/php/number_format/
    // original by: Jonas Raoni Soares Silva (https://www.jsfromhell.com)
    // improved by: Kevin van Zonneveld (https://kvz.io)
    // improved by: davook
    // improved by: Brett Zamir (https://brett-zamir.me)
    // improved by: Brett Zamir (https://brett-zamir.me)
    // improved by: Theriault (https://github.com/Theriault)
    // improved by: Kevin van Zonneveld (https://kvz.io)
    // bugfixed by: Michael White (https://getsprink.com)
    // bugfixed by: Benjamin Lupton
    // bugfixed by: Allan Jensen (https://www.winternet.no)
    // bugfixed by: Howard Yeend
    // bugfixed by: Diogo Resende
    // bugfixed by: Rival
    // bugfixed by: Brett Zamir (https://brett-zamir.me)
    //  revised by: Jonas Raoni Soares Silva (https://www.jsfromhell.com)
    //  revised by: Luke Smith (https://lucassmith.name)
    //    input by: Kheang Hok Chin (https://www.distantia.ca/)
    //    input by: Jay Klehr
    //    input by: Amir Habibi (https://www.residence-mixte.com/)
    //    input by: Amirouche
    //   example 1: number_format(1234.56)
    //   returns 1: '1,235'
    //   example 2: number_format(1234.56, 2, ',', ' ')
    //   returns 2: '1 234,56'
    //   example 3: number_format(1234.5678, 2, '.', '')
    //   returns 3: '1234.57'
    //   example 4: number_format(67, 2, ',', '.')
    //   returns 4: '67,00'
    //   example 5: number_format(1000)
    //   returns 5: '1,000'
    //   example 6: number_format(67.311, 2)
    //   returns 6: '67.31'
    //   example 7: number_format(1000.55, 1)
    //   returns 7: '1,000.6'
    //   example 8: number_format(67000, 5, ',', '.')
    //   returns 8: '67.000,00000'
    //   example 9: number_format(0.9, 0)
    //   returns 9: '1'
    //  example 10: number_format('1.20', 2)
    //  returns 10: '1.20'
    //  example 11: number_format('1.20', 4)
    //  returns 11: '1.2000'
    //  example 12: number_format('1.2000', 3)
    //  returns 12: '1.200'
    //  example 13: number_format('1 000,50', 2, '.', ' ')
    //  returns 13: '100 050.00'
    //  example 14: number_format(1e-8, 8, '.', '')
    //  returns 14: '0.00000001'

    number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
    var n = !isFinite(+number) ? 0 : +number
    var prec = !isFinite(+decimals) ? 0 : Math.abs(decimals)
    var sep = (typeof thousandsSep === 'undefined') ? ',' : thousandsSep
    var dec = (typeof decPoint === 'undefined') ? '.' : decPoint
    var s = ''

    var toFixedFix = function (n, prec) {
        if (('' + n).indexOf('e') === -1) {
            return +(Math.round(n + 'e+' + prec) + 'e-' + prec)
        } else {
            var arr = ('' + n).split('e')
            var sig = ''
            if (+arr[1] + prec > 0) {
                sig = '+'
            }
            return (+(Math.round(+arr[0] + 'e' + sig + (+arr[1] + prec)) + 'e-' + prec)).toFixed(prec)
        }
    }

    // @todo: for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec).toString() : '' + Math.round(n)).split('.')
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || ''
        s[1] += new Array(prec - s[1].length + 1).join('0')
    }

    return s.join(dec)
}

module.exports.getTxnUniqueReference = params => {
    let {payment_provider,VendorTxCode,CrossReference} = params;
    switch (payment_provider) {
        case 'OPTOMANY':
        case 'STRIPE':
            return CrossReference;
        case 'CARDSTREAM':
            return VendorTxCode
        case 'ADYEN':
        return CrossReference
        case 'CARDSTREAM-CH':
        return CrossReference
        case 'DNA':
            return CrossReference
        case 'ADYEN-HF':
            return CrossReference
        default:
            return null;
    }
};

module.exports.getThreeDsStatus = (params) => {
    if (params.payment_provider == 'CARDSTREAM') {
        if (params.origin == 'WebForm-CS-3D') {
            return '3DS Authenticated';
        } else {
            return '3DS Not Authenticated';
        }
    } else if (params.payment_provider == 'OPTOMANY' && params.origin == 'WebForm-3D') {
        return '3DS Authenticated';
    } else {
        return '3DS status not available'
    }
}


module.exports.isDatesOverlapping = (specialRentDate, payload) =>{
    for(let date of specialRentDate){
        if( (payload.start_date <= date.start_date && payload.end_date >= date.start_date) ||
          (payload.start_date >= date.start_date && payload.end_date <= date.end_date) ||
          (payload.start_date <= date.end_date && payload.end_date >= date.end_date)){
            console.log('overlapping dates', date);
            return true;
        }
    }
    return false;
}

module.exports.roundOfInteger = (num) => {
    return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

module.exports.transactionReferenceColumn = {
    DNA: 'cross_reference',
    CARDSTREAM: 'VendorTxCode'
}

module.exports.decryptData = (encryptedData) => {
    try {
        const secret = process.env.ENCRYPTION_KEY
        const decrypted = CryptoJS.AES.decrypt(encryptedData, secret);
        const decryptData = decrypted.toString(CryptoJS.enc.Utf8);
        return decryptData; 
    } catch (e) {
        console.log(e)
        throw {message: "Invalid transaction reference"}    
    }
};
