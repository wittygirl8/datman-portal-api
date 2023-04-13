const soap = require("soap")
const moment = require("moment")
const crypto = require("crypto")

module.exports.Authorize = (request, config) => {

    request.AuthenticationDetails = authRequest('EftRequest', config)
    request.TransactionDateTimeUtc = moment().utc().toISOString()

    let url = `https://ppe.optpg.com/EftAuthorizationEntryPoint/v1/AuthorizationEntryPoint.svc`
    let options = {
        endpoint: `${url}/soap`,
        trace: 1,
        returnFault: true,
    }

    return new Promise((resolve, reject) => {
        soap.createClient(`${url}?singleWsdl`, options, function (err, client) {
            client.wsdl.definitions.xmlns.ns1 = 'http://schemas.datacontract.org/2004/07/Optomany.Messaging.EntryPoint'
            client.wsdl.xmlnsInEnvelope = client.wsdl._xmlnsMap()
            client.Authorize({
                request: request
            }, function (err, result, rawResponse, soapHeader, rawRequest) {

                if (err) {
                    reject(err)
                }
                else {
                    resolve(result)
                }
            });
        })
    })

}

module.exports.Settle = (authorizeReq, authorizeResp, config) => {

    let AuthorizeResult = authorizeResp.AuthorizeResult
    let request = {
        Reference: authorizeReq.Reference,
        AuthenticationDetails: 'placeholder',
        SendAttempt: 1,
        Amounts: authorizeReq.Amounts,
        AuthCode: AuthorizeResult.AuthCode,
        AuthorizationType: authorizeReq.AuthorizationType,
        CaptureModeType: authorizeReq.CaptureModeType,
        CardholderEngagementMethodType: authorizeReq.CardholderEngagementMethodType,
        CountryId: authorizeReq.CountryId,
        EftPaymentId: AuthorizeResult.EftPaymentId,
        MerchantDepartmentId: authorizeReq.MerchantDepartmentId,
        PaymentChannel: AuthorizeResult.PaymentChannel,
        ResponseCode: AuthorizeResult.ResponseCode,
        Settle: true,
        TokenDetails: authorizeReq.TokenDetails,
    }

    request.AuthenticationDetails = authRequest('SettlementRequest', config)
    request.TransactionDateTimeUtc = moment().utc().toISOString()
    let url = `https://ppe.optpg.com/EftSettlementEntryPoint/v1/settlementEntryPoint.svc`
    let options = {
        endpoint: `${url}/soap`,
        trace: 1,
        returnFault: true,
    }
    return new Promise((resolve, reject) => {
        soap.createClient(`${url}?singleWsdl`, options, function (err, client) {
            client.wsdl.definitions.xmlns.ns1 = 'http://schemas.datacontract.org/2004/07/Optomany.Messaging.EntryPoint'
            client.wsdl.definitions.xmlns.q1 = 'http://schemas.datacontract.org/2004/07/Optomany.Messaging.EntryPoint'
            client.wsdl.xmlnsInEnvelope = client.wsdl._xmlnsMap()
            client.Settle({
                request: request
            }, function (err, result, rawResponse, soapHeader, rawRequest) {

                console.log(rawRequest)

                if (err) {
                    reject(err)
                }
                else {
                    resolve(result)
                }
            });
        })
    })

}

const authRequest = (request, auth) => {

    let requestTime = moment().utc()
    let data = `${auth.MerchantSignatureKeyId}${requestTime.format('D/M/Y H:mm:ss')}${request}${auth.MerchantStoreId}`

    let hmacSignature = crypto.createHmac('sha256', Buffer.from(auth.Signature))
        .update(data)
        .digest()
        .toString('base64');
    return {
        MerchantSignatureKeyId: auth.MerchantSignatureKeyId,
        RequestDateTimeUtc: requestTime.format('YYYY-MM-DDTHH:mm:ss'),
        RequestType: request,
        MerchantStoreId: auth.MerchantStoreId,
        SignatureType: auth.SignatureType,
        Signature: hmacSignature
    }
}

/**
 * based on the provider it returns the optmany config
 */
module.exports.requestConfig = (provider)=>{
    if(provider == 'FH'){
        console.log('foodhub config is selected')
        return {
            MerchantSignatureKeyId : 1,
            SignatureType : 'Hmac256',
            Signature : '28FD604F-B953-4498-9FE7-D2BC39BB797C',
            MerchantStoreId : 71176,
            MerchantDepartmentId: 354872
        }
    }
    else if(provider == 'T2S'){
        console.log('t2s config is selected')
        return {
            MerchantSignatureKeyId : 1,
            SignatureType : 'Hmac256',
            Signature : '1D48005B-824F-46DD-BC0A-71C602CB0CF9',
            MerchantStoreId : 360958,
            MerchantDepartmentId: 354874
        }

    }
    else {
        console.log('selected provider is invalid')
        return null
    }

}


// // Takeaway.je
// $settings['takeaway'] = [
//     'MerchantStoreId' => 360958,
//     'MerchantDepartmentId' => 354874,
//     'MerchantNumber' => 3009677,
//     'Sign' => [
//         'MerchantSignatureKeyId' => 1,
//         'SignatureType' => 'Hmac256',
//         'Signature' => '1D48005B-824F-46DD-BC0A-71C602CB0CF9',
//         'MerchantStoreId' => 360958,
//     ]
// ];