const { sequelizeInstance, Sequelize } = require('../')
const CardstreamRefundLog = sequelizeInstance.define('', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
    },
    card_payment_id: {
      type: Sequelize.INTEGER
    },
    xref: {
      type: Sequelize.STRING
    },
    amount: {
      type: Sequelize.STRING
    },
    outcome: {
      type: Sequelize.INTEGER
    }
    }, {
      timestamps: false,
      tableName: 'cardstream_refund_log',
      freezeTableName: true,
      omitNull: true
    })
  module.exports = CardstreamRefundLog