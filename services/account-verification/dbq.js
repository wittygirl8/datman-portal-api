const AccountVerification = require('../../database/model/account_verification')

module.exports.createAccountVerificationRequest = (params) => {
    return AccountVerification.create(
        { 
            "customer_id": params.customer_id,
            "uploaded_by": "CLIENT",
            "file_upload_version": "v2"
        });
}

