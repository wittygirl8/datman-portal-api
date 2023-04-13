const { sequelizeInstance, Sequelize } = require('../')
const ChargeBack = sequelizeInstance.define('ChargeBack', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  payment_id: {
    type: Sequelize.INTEGER(11)
  },
  date: {
    type: Sequelize.STRING
  },
  reason: {
    type: Sequelize.STRING
  },
  comments: {
    type: Sequelize.STRING
  },
  outcome: {
    type: Sequelize.ENUM,
    values: ['RESOLVED', 'NOTRESOLVED']
  },
  tel: {
    type: Sequelize.STRING
  },
  customer_id: {
    type: Sequelize.STRING
  },
}, {
  timestamps: false,
  tableName: 'charge_back',
  freezeTableName: true,
  omitNull: true
})
module.exports = ChargeBack