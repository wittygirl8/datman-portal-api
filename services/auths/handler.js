const async = require('async');
const request = require('request')
const jwt = require('jsonwebtoken');
const Joi = require('@hapi/joi');
const md5 = require('md5');

const dbq = require('./dbq')
const gDbq = require('../../database/global-db-queries')
const helpers = require('../../library/helpers')

const jwkToPem = require('jwk-to-pem');
const axios = require('axios');
const base64 = require('base-64');
const utf8 = require('utf8');

// Mypay cognito user-pool config
// need to move to env file
const userPoolId = process.env.USER_POOL_ID;
const region = process.env.REGION;
const iss = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
}

module.exports.login = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let params;

    try {

        let payload = JSON.parse(event.body);
        //Schema for the key validation of the request body
        const schema = Joi.object({
            email: Joi.string().required(),
            password: Joi.string().required(),
            rememberme: Joi.boolean().required()
        })
        await schema.validateAsync(payload)

        // authenticate the user
        // Do the db lookup based on emial and md5(password)
        params = {
            email: payload.email,
            password: md5(payload.password)
        }

        let customerDetails = await dbq.authUserCrendetial(params)
        if (!customerDetails) {
            let message = "No record found for provided credentials"
            console.log(message)
            let response = {
                status: "FAILL",
                message
            }
            return helpers.LambdaHttpResponse2(401, response, headers)
        }
        if (customerDetails.progress_status != 2) {
            let message = "Your account is in inactive state"
            console.log(message)
            let response = {
                status: "FAILL",
                message
            }
            return helpers.LambdaHttpResponse2(401, response, headers)

        }

        params = {
            customerId: customerDetails.id
            // customerId: "123876786"
        }

        let otherDetails = await gDbq.getOtherCustomerDetails(params)
        console.log('OTHER DETAILS', otherDetails)
        if (!otherDetails) {
            otherDetails['txtBAddressLine1'] = ""
            otherDetails['txtBAddressLine2'] = ""
            otherDetails['txtBCity'] = ""
            otherDetails['ddlBCountry'] = ""
            otherDetails['txtWebSiteURL'] = ""
            otherDetails['accountnumber'] = "",
                otherDetails['sortcode'] = ""
        }
        let profile = {
            user: {
                firstname: customerDetails.clients_fname,
                lastname: customerDetails.clients_lastname,
                currency: customerDetails.currency,
            },

            business: {
                id: customerDetails.id,
                name: customerDetails.business_name,
                address_1: customerDetails.business_number + ' ' + customerDetails.business_street,
                address_2: '',
                address_3: customerDetails.business_city,
                address_4: customerDetails.business_county,
                postcode: customerDetails.business_post_code,
                phone: customerDetails.business_phone_number,
                email: customerDetails.business_email
                // bankaccount: otherDetails.accountnumber.substr(otherDetails.accountnumber.length - 4),
                // sortcode: otherDetails.sortcode
            }

        }
        console.log("txtWebSiteURL", otherDetails.txtWebSiteURL)
        let host = otherDetails.txtWebSiteURL
        let replaces = ['https://', 'http://', 'www.']
        replaces.forEach((v) => {
            host = host.replace(v, '')
        })
        host = host.replace(new RegExp("[^a-zA-Z\.]+", "i"), '');


        const jwtPayload = {
            merchant_id: customerDetails.id,
            host,
            scopes: [
                'client', 'withdraw/', 'account_balance/'
            ]
        }
        // issue jwt
        //cons

        // For remember me clients refresh token will last for longer time ie between 3-6 months
        let refreshToken
        if( payload.rememberme == true) {
            refreshToken = jwt.sign(jwtPayload, customerDetails.refresh_key, { expiresIn: process.env.WITH_REMEMBER_ME_RF_TOKEN_EXP_TIME })            
        }
        else {
            refreshToken = jwt.sign(jwtPayload, customerDetails.refresh_key, { expiresIn: process.env.WITHOUT_REMEMBER_ME_RF_TOKEN_EXP_TIME })
        }
        
        const token = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXP_TIME })
        // return jwt token
        return helpers.LambdaHttpResponse2(200, { token, refresh_token: refreshToken, profile, rememberme: payload.rememberme }, headers)
    }
    catch (e) {
        console.log('CRASHED', e.message)
        return helpers.LambdaHttpResponse2(401, { message: e }, headers)

    }
}

module.exports.refreshToken = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false
    let payload = JSON.parse(event.body)
    let params;
    try {
        const refreshToken = payload.refresh_token
        if (!refreshToken) {
            let message = "Unable to validate user please provide the jwt token"
            return helpers.LambdaHttpResponse2(401, { message }, headers)
        }

        let decoded1 = jwt.decode(refreshToken)
        console.log('after decode', decoded1)
        params = {
            customerId: decoded1.merchant_id
        }

        let customerDetails = await gDbq.getCustomerDetails(params)
        console.log('refesh token fromdb', customerDetails.refresh_key)


        let decoded = await helpers.verifyJwt(refreshToken, customerDetails.refresh_key)
        let jwtPayload = {
            merchant_id: decoded.merchant_id,
            email: decoded.email,
            host: decoded.host,
            scopes: decoded.scopes
        }

        const token = jwt.sign(jwtPayload, process.env.ACCESS_TOKEN_JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXP_TIME })
        let response = {
            status: "OK",
            data: {
                token
            }
        }

        return helpers.LambdaHttpResponse2(200, response, headers)

    }
    catch (e) {
        console.log('hey worongsss', e)
        return helpers.LambdaHttpResponse2(202, { message: e }, headers)
    }



}

let authorize = module.exports.authorize = (event, context, callback, authLevels = []) => {
  context.callbackWaitsForEmptyEventLoop = false;
  console.log('see this eve', JSON.stringify(event, null, 2));
  let decoded;
  let merchantId;
  let params;
  try {
    // validate the params for Authorization
    /**
     * code will be added
     */
    const token = event.authorizationToken
      .split('Bearer ')
      .pop()
      .split('!!!')[0];
    const additionalBase64 = event.authorizationToken.split('!!!')[1];

    if (token === undefined || !token) {
      let message = 'Unable to validate user please provide the jwt token';
      // return helpers.LambdaHttpResponse2(401, { message }, headers)
      callback('Unauthorized');
      return;
    }
    //Check request source: Mypay or crm
    if (additionalBase64 === undefined || !additionalBase64) {
      // verify jwt and decode for crm
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_JWT_SECRET);
      merchantId = decoded.merchant_id;
      // const user = {'h':1234};
      // console.log(user)
      isAllowed = true;

      const effect = isAllowed ? 'Allow' : 'Deny';
      const authorizerContext = { 'payload': JSON.stringify(decoded) };
      // Return an IAM policy document for the current endpoint
      const policyDocument = helpers.buildIAMPolicy(
        merchantId,
        effect,
        event.methodArn,
        authorizerContext
      );
      // return helpers.LambdaHttpResponse2(200, {}, headers)
      callback(null, policyDocument);
    } else {
      console.log(token);
      // verify cognito user-pool token and decode for Mypay
      decodeCognitoToken(token).then(function (value) {
        console.log(value);

        decoded = value;

        const bytes = base64.decode(additionalBase64);
        merchantId = utf8.decode(bytes);
        decoded.merchant_id = merchantId;
        merchantId = decoded.merchants.includes(merchantId) ? merchantId : null;
        
        if (
          !decoded.merchants.includes(merchantId) &&
          decoded.scopes !== "Admin" &&
          decoded.scopes !== "Reseller" &&
          decoded.scopes !== "SuperAdmin"
        ) {
          callback("Unauthorized");
          return;
        }
        
        isAllowed = true;
        //check for passed on scopes and perform authorization
        if(authLevels.length !== 0 && !authLevels.includes(decoded.scopes)){
          console.log('Auth level failed!',authLevels.length !== 0, !authLevels.includes(decoded.scopes), authLevels, decoded.scopes)
          isAllowed = false;
        } 
        
        const effect = isAllowed ? 'Allow' : 'Deny';
        const authorizerContext = { 'payload': JSON.stringify(decoded) };
        // Return an IAM policy document for the current endpoint
        const policyDocument = helpers.buildIAMPolicy(
          merchantId,
          effect,
          event.methodArn,
          authorizerContext
        );
        // return helpers.LambdaHttpResponse2(200, {}, headers)
        callback(null, policyDocument);
      }).catch(error=>{
        console.log('decodeCognitoToken error',error);
        callback('Unauthorized');
      });
    }

    // Checks if the user's scopes allow her to call the current function
    // const isAllowed = authorizeUser(user.scopes, event.methodArn);

    // console.log('ran till here')
  } catch (e) {
    console.log('hey worongsss', e);
    // return helpers.LambdaHttpResponse2(401, { e }, headers)
    // callback(null, policyDocument);
    // return helpers.LambdaHttpResponse2(401, { message: e })
    callback('Unauthorized');
    return;
  }
};
/**
 * destroy the webtoken once the user logs out
 */

module.exports.authorize_admin = (event, context, callback) => {
  let authLevels = ['SuperAdmin', 'Admin'];
  authorize(event, context, callback, authLevels);
}

module.exports.authorize_reseller = (event, context, callback) => {
  let authLevels = ['SuperAdmin', 'Admin','Reseller'];
  authorize(event, context, callback, authLevels);
}

module.exports.authorize_super_admin = (event, context, callback) => {
  let authLevels = ['SuperAdmin'];
  authorize(event, context, callback, authLevels)
};


module.exports.destroy = async (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false


}

module.exports.getUserId = async (event) => {
  try {
    const token = event.headers['Authorization']
    .replace(/['"]+/g, '')
    .replace(/Bearer/g, '')
    .trim().split('!!!')[0];

    const result = await decodeCognitoToken(token);
    return result["myPayUserId"];
  } catch (e) {
    throw new Error("Token decode failed");
  }
};

//  decodeCognitoToken function, user in `authorizer` to verify Mypay user-pool token
const decodeCognitoToken = async (token) => {
  try {
    console.log('in decodeCognitoToken');

    const pems = await getPems();

    //Fail if the token is not jwt
    var decodedJwt = jwt.decode(token, { complete: true });
    console.log(decodedJwt);
    if (!decodedJwt) {
      console.log('Not a valid JWT token');
      throw { message: 'Not a valid JWT token' };
    }

    //Fail if token is not from your User Pool
    if (decodedJwt.payload.iss != iss) {
      console.log(iss);
      console.log('invalid issuer');
      throw { message: 'invalid issuer' };
    }
    var kid = decodedJwt.header.kid;
    var pem = pems[kid];
    if (!pem) {
      console.log('Invalid access token');
      throw { message: 'Invalid access token' };
    }

    console.log('before verify');
    //Verify the signature of the JWT token to ensure it's really coming from your User Pool
    const result = jwt.verify(token, pem, { issuer: iss });
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

async function getPems() {
  console.log('in getPems');
  //Download the JWKs and save it as PEM
  try {
    const response = await axios.get(`${iss}/.well-known/jwks.json`);
    if (response.status === 200) {
      console.log('getPems success');
      var pems = {};
      var keys = response.data.keys;
      for (var i = 0; i < keys.length; i++) {
        //Convert each key to PEM
        var key_id = keys[i].kid;
        var modulus = keys[i].n;
        var exponent = keys[i].e;
        var key_type = keys[i].kty;
        var jwk = { kty: key_type, n: modulus, e: exponent };
        var pem = jwkToPem(jwk);
        pems[key_id] = pem;
      }
    }
    return pems;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
