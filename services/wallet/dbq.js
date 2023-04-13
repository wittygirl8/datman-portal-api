const moment = require('moment-timezone');
const Account = require('../../database/model/account')
const provider = require('../../database/model/provider')
const voucher = require('../../database/model/voucher')
const transaction = require('../../database/model/transaction')
const user= require('../../database/model/users')




const securityCredentials= require('../../database/model/security_credentials')
const businessGroup= require('../../database/model/business_group')
const wallet= require('../../database/model/wallet')

const { Sequelize } = require('../../database')
const Op = Sequelize.Op

module.exports.getProvider = (params) => {
    return new Promise((resolve, reject) => {
        provider.findOne({
            where: {
                api_key: params.api_key
            },
            attributes: ['id', 'api_key']
        }).then((values) => {
            try {
                console.log('provider vlaue')
                resolve(values.dataValues)
            }
            catch (e) {
                let message = 'unable to fetch the datman providers'
                reject({ message })
            }
        })
    })
}

module.exports.updateAccount = (params) => {
    return new Promise((resolve, reject) => {
        Account.update({
            api_key: params.api_key
        },
            {
                where: { api_key: params.partial_api_key },
                returning: true,
                plain: true
            }
        ).then((updatedDetails) => {
            //this function does not return the object of db
            try {
                console.log('updatedDetails', updatedDetails)
                resolve({ api_key: params.api_key })
            }
            catch (e) {
                reject(e)

            }
        }, (err) => {
            reject(err)
        })
    })
}

module.exports.createAccount = (params) => {
    return new Promise((resolve, reject) => {
        Account.create({
            client_ref_id: params.client_ref_id,
            api_key: params.partialAccountApiKey,
            user_id: params.user_id,
            provider_id: params.provider_id,
            account_type: params.account_type,
            balance: params.balance,
            status: params.status
        })
            .then((newAccount) => {
                try {
                    console.log('newly Account created', newAccount)
                    resolve(newAccount.dataValues)
                }
                catch (e) {
                    reject(e)
                }
            }, (err) => {
                let message = "unable to create new Account"
                reject({ message, err })
            })
    })
}

module.exports.updateAccountBalance = (params) => {
    console.log('see bal parma', params)
    return new Promise((resolve, reject) => {
        
        Account.increment(['balance'], { by: `${parseFloat(params.amount).toFixed(2)}`, where: { api_key: params.api_key } })
            .then((s) => {
                console.log(s)
                resolve()

            });
    })
}

// module.exports.createTransaction = (params) => {
//     console.log('trying for new transaction', params)
//     return new Promise((resolve, reject) => {
//         transaction.create({
//             type: params.type,
//             amount: parseFloat(params.amount).toFixed(2),
//             currency: params.currency,
//             account_id: params.account_id,
//             provider_id: params.provider_id,
//             state: params.state,
//             payment_ref: params.payment_ref
//         }).then((transactionRecord) => {
//             resolve(transactionRecord)
//         },(err)=>{
//             console.log('unable to create the new transaction')
//             reject(err)
//         })
//     })
// }



module.exports.registerUser = (params) => {
        return user.create({
            first_name: params.firstname,
            last_name: params.lastname,
            email: params.email,
            phone: params.phone,            
            comments: params.comments || ''
        })   
}




// start new way 

/**
 * retrive the buisness details if Access Key matches
 * returns buisness details
 */
module.exports.verifySecurityCred = (params) => {
    return securityCredentials.findOne({
        where: {access_key: params.accessKey},
        attributes: ['business_group_id', 'type']
    })
}

/**
 * Checks the if wallet contains the same reference id
 */
module.exports.isRefExist = (params) => {
    console.log('params', params)
    return wallet.findOne({
        where: {refrence_id: params.refId, business_group_id: params.businessGroupId},
        attributes: ['id']
    })
}

/**
 * Create a wallet with few basic information
 * return the id of wallet
 */
module.exports.createWallet = (params) => {
    dbParams= {
        fname: params.fname,
        lname: params.lname,
        email: params.email,
        refrence_id: params.refId,
        business_group_id: params.businessGroupId 
    }
    return wallet.create(dbParams)
}

/**
 * create a new transaction 
 */
module.exports.createTransaction = (params) => {
    dbParams = {
        type: params.type,
        amount: params.amount,
        currency: params.currency,
        business_group_id: params.businessGroupId,
        business_id: params.business_id
    }
    return transaction.create(dbParams)
}