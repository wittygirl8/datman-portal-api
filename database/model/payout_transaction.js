const { sequelizeInstance, Sequelize } = require('../')

const PayoutTransaction = sequelizeInstance.define('payout_transaction', {
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    merchant_id: {
      type: Sequelize.INTEGER(11),
    },
    payment_provider: {
      type: Sequelize.STRING,
    },
    amount: {
      type: Sequelize.DOUBLE(10,2),
    },
    currency: {
      type: Sequelize.STRING,
    },
    provider_reference: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.ENUM,
      values: ['PENDING','SENT','FAILED']
    },
    more_info: {
      type: Sequelize.STRING,
    },
    expected_date: {
      type: Sequelize.TIME,
    },
    created_at: {
      type: Sequelize.TIME,
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    omitNull: true

  }
)
module.exports = PayoutTransaction

