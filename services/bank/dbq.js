const { sequelizeInstance, Sequelize } = require('../../database');
module.exports.getBankError = () =>{
  const query = `
            SELECT pwl.*,cu.business_name,co.country_name FROM pending_withdrawals_client_list_log pwl 
            join customers cu on pwl.customer_id = cu.id
            join country co on cu.country_id = co.id
            WHERE pwl.status = 'PENDING'
  `;
  return sequelizeInstance.query(query,{
    type: Sequelize.QueryTypes.SELECT
  });
}