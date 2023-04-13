
const Customers = require('../model/customers')
const OtherCustomerDetails = require('../model/other_customer_details')
const user= require('../model/users')
const Payment = require('../model/payment')

const {Sequelize,sequelizeInstance} = require('../')
const Op = Sequelize.Op
module.exports.isCustomerExists = (info) => {
    let { From} = info;
    let customers_mobile = From.replace('+44', '0')
    let customers_email = "" // need to remove just for testing purpose
    return new Promise((resolve, reject) => {
        Customers.findOne({
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

module.exports.registerUser = (params) => {

    return new Promise((resolve, reject)=>{
        user.create({
            first_name: params.firstname,
            last_name: params.lastname,
            email: params.email,
            phone: params.phone,
            
            comments: params.comments || ''
        })
        .then((newUser)=>{
            try {
                console.log('newly user created', newUser)  
                resolve(newUser.dataValues) 
            }
            catch(e) {
                reject(e)
            }     
        }, (err)=>{
            let message= "unable to create new user"
            reject({message, err})
        })
    })

    
}

module.exports.getOtherCustomerDetails = (params) => {
    return OtherCustomerDetails.findOne({
        where: {
            customers_id: params.customerId
        }        
    })
}

module.exports.getCustomerDetails = (params) => {
    return Customers.findOne({
        where: {
            id: params.customerId
        }        
    })
}

module.exports.getAnnouncements = (params) => {
    return sequelizeInstance.query(
      `SELECT message FROM customer_announcements 
          WHERE CURDATE() between start_date and end_date 
          order by id desc limit 1`,
      { type: Sequelize.QueryTypes.SELECT })
}

module.exports.firstWithdrawl = (params) => {
    
      return Payment.findAll({
        attributes: [
            "firstname",
            "customer_id"
        ],
            where:{
                [Op.and]:[
                    {firstname:'withdraw'},
                    {customer_id:params.customerId}
                ]
            },
            raw:true
      })
}