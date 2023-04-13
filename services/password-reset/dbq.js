const generator = require('generate-password');
const md5 = require('md5');
const customers = require('../../database/model/customers')
const {Sequelize} = require('../../database')
const Op = Sequelize.Op

/**
 *  @param {Object} info
 * Does the lookup based on phone number or email.
 */
module.exports.isCustomerExists = (info) => {
    let { From} = info;
    let customers_mobile = From.replace('+44', '0')
    let customers_email = "" // need to remove just for testing purpose
    return new Promise((resolve, reject) => {
        customers.findOne({
            where: {
                // [Op.or]: [{ customers_mobile }, { customers_email }, {business_phone_number: customers_mobile}]
                [Op.or]: [{ customers_mobile },{business_phone_number: customers_mobile}]
            }

        })
            .then((values) => {
                /** */
                try {
                    console.log('values : ', values.dataValues)
                    resolve(values.dataValues)
                }
                catch (e) {
                    let mes = 'failed from isCustomerExists'
                    // console.error(e)
                    reject({ mes })
                }
            })
    })
}

/**
 * This function updates to the new password using below algo
 * > Genrate a new random password {_rp}
 * > do md5(rp) and update that record
 * > retrun plain text password
 *  @param {Object} info
 */
module.exports.changePassword = (info) => {
    // let { From: customers_mobile, email:customers_email } = info;
    let { From} = info;
    let customers_mobile = From.replace('+44', '0')
    let password_plain_text = generator.generate({
        length: 8,
        numbers: true,
        uppercase: false,
        excludeSimilarCharacters: true
    });

    let customers_email = "" // need to remove just for test
    return new Promise((resolve, reject) => {
        let password_md5 = md5(password_plain_text)
        customers.update(
            {
                customer_password: password_md5
            },
            {
                where: {
                    // [Op.or]: [{ customers_mobile }, { customers_email }, {business_phone_number: customers_mobile}]
                    [Op.or]: [{ customers_mobile }, {business_phone_number: customers_mobile}]
                }
            }
        )
            .then((success) => {
                resolve(password_plain_text)

            }, (err) => {
                reject(err)
            })
    })
}

module.exports.isClientPhoneExist= (params) => {
   return customers.findAll({
        where : {
            // [Op.or]: [{customers_mobile: params.phone}, {business_phone_number: params.phone}],
            customers_mobile: params.phone,
            progress_status: 2
        }
    })

}

module.exports.isClientEmailExist = (params) => {
    return customers.findAll({
        where : {
            // [Op.or]: [{business_email: params.email}, {customers_email: params.email}],
            customers_email: params.email,
            progress_status: 2
        }
    })    
}

module.exports.updatePasswordViaPhone = (params) => {

    let password_md5 = md5(params.plainPassword)
    return customers.update(
        {
            customer_password: password_md5
        },
        {
            where: {
                // [Op.or]: [{ customers_mobile }, { customers_email }, {business_phone_number: customers_mobile}]
                // [Op.or]: [{ customers_mobile: params.phone }, {business_phone_number: params.phone }],
                customers_mobile: params.phone,
                progress_status: 2,
                id: params.id
            }
        }
    )
}

module.exports.updatePasswordViaEmail = (params) => {

    let password_md5 = md5(params.plainPassword)
    return customers.update(
        {
            customer_password: password_md5
        },
        {
            where: {
                // [Op.or]: [{ customers_mobile }, { customers_email }, {business_phone_number: customers_mobile}]
                // [Op.or]: [{business_email: params.email}, {customers_email: params.email}],
                customers_email: params.email,
                progress_status: 2,
                id: params.id
            }
        }
    )
}