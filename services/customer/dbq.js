const Customer = require('../../database/model/customers')
const OtherCustomerDetails = require('../../database/model/other_customer_details')
const BankConfirmation = require('../../database/model/bank_confirmation')
const BankValidationlog = require('../../database/model/bank_validation_log')
const BankValidationKey = require('../../database/model/bank_validation_key')
const FeeTier  = require('../../database/model/fee_tiers')
const {sequelizeInstance,Sequelize} = require('../../database')

const md5 = require('md5');
/*
This function checks if the phone number belongs to customer table
if yes, then returns 'true'
*/

module.exports.createTransaction = () => {
    return sequelizeInstance.transaction()
}

module.exports.commitTransaction = (transaction) => {
    return transaction.commit()
}

module.exports.rollbackTransaction = (transaction) => {
    return transaction.rollback()
}

module.exports.updateAddress = (data,merchant_id) => {
    return Customer.update(
        { 
            "business_name":data.business_name,
            "business_number":data.business_number,
            "business_street":data.business_street,
            "business_city":data.business_city,
            "business_county":data.business_county,
            "business_post_code":data.business_post_code,
            "business_phone_number":data.business_phone_number,
            "business_email":data.business_email,
            "clients_fname":data.clients_fname,
            "clients_sname":data.clients_sname,
            "customers_number":data.customers_number,
            "customers_street":data.customers_street,
            "customers_city":data.customers_city,
            "customers_county":data.customers_county,
            "customers_post_code":data.customers_post_code,
            "customers_mobile":data.customers_mobile,
            "customers_email":data.customers_email
        },
        { where: {id: merchant_id}
    });
}

module.exports.fetchAddress = (merchant_id) => {
	return Customer.findOne({
        attributes: ['business_name','business_number','business_street','business_city','business_county','business_post_code','business_phone_number','business_email','clients_fname','clients_sname','customers_number','customers_street','customers_city','customers_county','customers_post_code','customers_mobile','customers_email','account_verification_status'], //object
        where: {id: merchant_id}
    });
}

module.exports.getCustomer = (params) => {
	return Customer.findOne({
        where: params
    });
}

module.exports.fetchBankDetails = (merchant_id) => {
	return OtherCustomerDetails.findOne({
        attributes: ['accountnumber','sortcode'], //object
        where: {customers_id: merchant_id}
    });
}

module.exports.updatePassword = (new_password,merchant_id) => {
    return Customer.update(
        { 
            "customer_password":md5(new_password)
        },
        { where: {id: merchant_id}
    });
}

module.exports.checkPassword = (current_password,merchant_id) => {
    return Customer.findOne({
        where: {id: merchant_id,customer_password: md5(current_password)}
    });   
}

module.exports.updateBankDetails = (data,merchant_id) => {
    return BankConfirmation.create(
        { 
            "customer_id":merchant_id,
            "sortcode_old":data.existing_sortcode,
            "accountnumber_old":data.existing_account_number,
            "sortcode_new":data.new_sortcode,
            "accountnumber_new":data.new_account_number,
            // "bankname_new":data.bank_name,
            "accountholder_new":data.account_holder,
            "varify_bank_type":'UPDATE',
            "file_upload_version":"v2",
            "bank_details":data.bank_details
        });
}

module.exports.getBankConfirmationDetails = (params) => {
    return BankConfirmation.findOne({
        where: params
    });
}

module.exports.createBankValidationKey = (params) => {
    return BankValidationKey.create(params);
}

module.exports.updateBankValidationKey = (params) => {
    return BankValidationKey.update(params.values,{where: params.condition});
}

module.exports.getBankValidationKey = (params) => {
    return BankValidationKey.findOne({
        where: params
    });   
}

module.exports.getBankValidationLog = (params) => {
    return BankValidationlog.findOne({
        where: params
    });   
}

module.exports.createBankValidationLog = (params) => {
    return BankValidationlog.create(params)
}

module.exports.updateBankValidationLog = (params) => {
    console.log('inside dbq',params)
    return BankValidationlog.update(params.values,{where : params.condition})
}

module.exports.updateBankConfirmation = (params) => {
    console.log('update parmas', params)
    return BankConfirmation.update(params.values,{where: params.condition});
}

module.exports.updateOtherCustomerDetails = (params) => {
    return OtherCustomerDetails.update(params.values,{where: params.condition})
}

module.exports.updateFeeTierId = async (params) => {
    return await Customer.update(
      {
        fee_tier_id: params.fee_tier_id,
      },
      {
        where: { id: params.merchant_id },
      }
    );
};
  
module.exports.getAllFeeTiers = () => {
    return FeeTier.findAll({
      attributes: ["name", "id", "percentage_fee", "fixed_fee"],
    });
};

module.exports.getFeeTierId = (params) => {
	return FeeTier.findOne({
        where: {name:params}
    });
}

module.exports.fetchFeeTierId = async (merchantId) => {
    return await Customer.findOne({
      attributes: ["fee_tier_id"],
      where: {
        id: merchantId,
      },
    });
};



