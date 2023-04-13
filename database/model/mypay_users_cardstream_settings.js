const {sequelizeInstance, Sequelize} = require('../')

const MypayUsersCardstreamSettings = sequelizeInstance.define('MypayUsersCardstreamSettings', {
  id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
  },
  customer_id: {
    type: Sequelize.INTEGER
  },
  cs_merchant_id : {
    type: Sequelize.INTEGER,
  },
  cs_signature_key : {
    type: Sequelize.STRING
  },
  country_code: {
    type: Sequelize.INTEGER
  },
  currency_code: {
    type: Sequelize.INTEGER
  }
}, {
      timestamps: false,
      tableName: 'mypay_users_cardstream_settings',
      freezeTableName: true,
      omitNull: true
})

module.exports = MypayUsersCardstreamSettings

