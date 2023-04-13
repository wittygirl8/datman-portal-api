const { customAlphabet } = require('nanoid/non-secure');
const crypto = require('crypto');
const axios = require('axios');
const queryString = require('query-string');
const constants = require('./mypay-helpers');
module.exports.constants = {
  ref_name : {
    ITEMREF: 'item',
    SHOPPREF: 'shopp',
    USERREF: 'user',
    TEMPTRANSACREF: 'temptransac',
    TRANSACREF: 'transacRef',
    REFUNDREF: 'rfRef',
    ERROR_MESSAGE: 'Some thing went wrong, Please try again ',
    ERROR_TYPE: 'This the error type'
  },
  refs : {
    ITEM_REF: 'ITEM_REF',
    SHOPPER_REF: 'SHOPPER_REF',
    USER_REF: 'USER_REF',
    TEMP_TRANS_REF: 'TEMP_TRANS_REF',
    TRANS_REF: 'TRANS_REF',
    REFUND_REF: 'REFUND_REF',
    REQ_ID: 'REQ_ID',
    SK: 'SK',
    AK: 'AK',
    EMAIL: 'EMAIL'
  },
  page : {
    PERSONAL_DETAILS: 'PERSONAL_DETAILS',
    COMPANY_DETAILS: 'COMPANY_DETAILS',
    BANK_DETAILS: 'BANK_DETAILS'
  }
};

module.exports.generateNanoId = id_type => {
  const {
    ITEM_REF,
    SHOPPER_REF,
    USER_REF,
    TEMP_TRANS_REF,
    TRANS_REF,
    REFUND_REF,
    REQ_ID,
    SK,
    AK,
    EMAIL
  } = constants.constants.refs;

  //   const alphabet =
  //     id_type === REQ_ID
  //       ? '0123456789'
  //       : '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  const alphabet =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  //   const ref_length = id_type === REQ_ID ? 5 : 22;
  const ref_length = 22;

  const nanoid = customAlphabet(alphabet, ref_length);

  switch (id_type) {
    case ITEM_REF:
      return `item_${nanoid(alphabet, ref_length)}`;
    case SHOPPER_REF:
      return `shopper_${nanoid(alphabet, ref_length)}`;
    case USER_REF:
      return `user_${nanoid(alphabet, ref_length)}`;
    case TEMP_TRANS_REF:
      return `tt_${nanoid(alphabet, ref_length)}`;
    case REFUND_REF:
      return `refund_${nanoid(alphabet, ref_length)}`;
    case REQ_ID:
      return `reqid_${nanoid(alphabet, ref_length)}`;
    case TRANS_REF:
      return `tr_${nanoid(alphabet, ref_length)}`;
    case SK:
      return `sk_${nanoid(alphabet, ref_length)}`;
    case AK:
      return `ak_${nanoid(alphabet, ref_length)}`;
    case EMAIL:
      return `${nanoid(alphabet, ref_length).substr(0, 6)}@sandbox.com`;
    default:
      return null;
  }
};


module.exports.processCardStreamPayment = async (payload,signature) => {

  // get the keys in the object
  var items = Object.keys(payload);

  var string = '';

  // sort the array of keys
  items.sort();

  // for each key loop over in order
  items.forEach(function (item) {
    string += item + '=' + encodeURIComponent(payload[item]) + '&';
  });

  // remove the trailing &
  string = string.slice(0, -1);

  // below replaces are to ensure the escaping is the same as php's http_build_query()
  string = string.replace(/\(/g, '%28');
  string = string.replace(/\)/g, '%29');
  string = string.replace(/%20/g, '+');

  // make the new string
  payload =
    string +
    '&signature=' +
    crypto
      .createHash('SHA512')
      .update(string + signature)
      .digest('hex');

  let r = await axios.post('https://payments.mypay.co.uk/direct/', payload);
  let q = queryString.parse(r.data, { parseNumbers: true });
  return q;
};

module.exports.csCreateMerchant = async (params,cs_customer_id,mode) => {

  //return some testing value in migration 2 build
  //return 120940;
  if (mode === 'prod') {
    console.log(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers/${cs_customer_id}/merchants`);
    console.log(params);
    try {
      let response = await axios.post(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers/${cs_customer_id}/merchants`,params,{
        headers: {
          "Content-Type": 'application/json',
          "Authorization": `Basic ${Buffer.from(`${process.env.CS_API_USERNAME}:${process.env.CS_API_PASSWORD}`).toString('base64')}`
        }
      });
      return response.data.id
    }catch (e){
      throw ({"message":e.message})
    }
  } else {
    return 120940;
  }
};

module.exports.csCreateCustomer = async (params,mode) => {

  //return some testing value in migration 2 build
  //return 13860;
  if (mode === 'prod') {
    try {
      console.log(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers`);
      console.log(params);
      let response =  await axios.post(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers`,params,{
        headers: {
          "Content-Type": 'application/json',
          "Authorization":`Basic ${Buffer.from(`${process.env.CS_API_USERNAME}:${process.env.CS_API_PASSWORD}`).toString('base64')}`
        }
      });
      return response.data.id
    } catch (e) {
      console.log('error', e)
      throw ({"message":e.message})
    }
  } else {
    return 13860;
  }
};

module.exports.deleteCsCustomer = async (customer_id, mode) => {
  
  //return some testing value in migration 2 build
  //return Promise.resolve({ status: 'deleted test cs cardstream customer' });
  if (mode === 'prod') {
    console.log(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers/${customer_id}`);
    return axios.delete(`${process.env.CARDSTREAM_API_ENDPOINT}/rest/resellers/${process.env.RESELLER_ID}/customers/${customer_id}`, {
      headers: {
        "Content-Type": 'application/json',
        "Authorization": `Basic ${Buffer.from(`${process.env.CS_API_USERNAME}:${process.env.CS_API_PASSWORD}`).toString('base64')}`
      }
    });
  } else {
    return Promise.resolve({ status: 'deleted test cs cardstream customer' });
  }

};
