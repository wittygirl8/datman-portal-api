const { sequelizeInstance, Sequelize } = require('../../database');
const Payment = require('../../database/model/payment')
module.exports.getFeeInfo = (params) =>{
  const query = `SELECT percentage_fee,fixed_fee FROM fee_tiers f join customers c on f.id = c.fee_tier_id WHERE c.id = :merchant_id LIMIT 1`;
  return sequelizeInstance.query(query,{
    replacements:{
      merchant_id:params.merchant_id},
    type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.pushCredit = (params) =>{
 return Payment.create(params);
}

module.exports.getCustomerType = (params) => {
  const query = `SELECT id, customer_type, business_name from customers where id = :merchant_id`
  return sequelizeInstance.query(query, {
    replacements: {
      merchant_id: params.merchant_id
    },
    type: Sequelize.QueryTypes.SELECT
  });
};