const { sequelizeInstance, Sequelize } = require('../');
const MypayTempTransactionsMeta = sequelizeInstance.define('MypayTempTransactionsMeta', {
  id: {
    type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
  },
  data: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false,
  tableName: 'mypay_temp_transactions_meta',
  freezeTableName: true,
  omitNull: true
});
module.exports = MypayTempTransactionsMeta;
