const { sequelizeInstance, Sequelize } = require('../')
const MypayTempTransaction = sequelizeInstance.define('MypayTempTransaction', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
    },
    customer_id: {
      type: Sequelize.INTEGER
    },
    ref: {
      type: Sequelize.STRING
    },
    user_order_ref: {
      type: Sequelize.STRING
    },
    shopper_id: {
      type: Sequelize.INTEGER
    },
    item_id: {
      type: Sequelize.INTEGER
    },
    meta_id: {
      type: Sequelize.INTEGER
    },
    amount: {
      type: Sequelize.DOUBLE
    },
    currency_code: {
      type: Sequelize.INTEGER
    },
    invoice_expiry_date: {
      type : Sequelize.DATE,
      allowNull: true
    },
    link_expiry_date: {
      type : Sequelize.DATE,
      allowNull: true
    },
    status: {
      type: Sequelize.ENUM,
      values: ['IN_PROGRESS','PROCESSED']
    },
    sale_notification_id: {
      type: Sequelize.INTEGER
    }
    }, {
      timestamps: false,
      tableName: 'mypay_temp_transactions',
      freezeTableName: true,
      omitNull: true
    })
  module.exports = MypayTempTransaction