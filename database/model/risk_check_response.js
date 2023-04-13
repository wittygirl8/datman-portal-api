const { sequelizeInstance, Sequelize } = require('../')
const RiskCheckResponse = sequelizeInstance.define('RiskCheckResponse', {
  id: {
    type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
  },
  cardpayment_id: {
    type: Sequelize.INTEGER(11),
      allowNull: false
  },
  risk_check_id: {
    type: Sequelize.STRING,
      allowNull: false
  },
  provider: {
    type: Sequelize.STRING,
      allowNull: false
  },
  created_at: {
    type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
  },
  updated_at: {
    type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW
  }
},
{
  timestamps: false,
    tableName: 'risk_check_response',
  freezeTableName: true,
  omitNull: true
});
module.exports = RiskCheckResponse
