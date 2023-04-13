const { sequelizeInstance, Sequelize } = require('../')
const RefundRequestLog = sequelizeInstance.define('', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  card_payment_id: {
    type: Sequelize.FLOAT
  },
  order_id: {
    type: Sequelize.INTEGER
  },
  silent_mode: {
    type: Sequelize.STRING
  },
  refund_amount: {
    type: Sequelize.FLOAT
  },
  request_from: {
    type: Sequelize.STRING
  },
  json_payload: {
    type: Sequelize.STRING
  },
  notes: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false,
  tableName: 'refund_request_log',
  freezeTableName: true,
  omitNull: true
})
  module.exports = RefundRequestLog