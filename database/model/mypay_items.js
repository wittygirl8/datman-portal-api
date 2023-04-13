const { sequelizeInstance, Sequelize } = require('../')
const MypayItem = sequelizeInstance.define('MypayItem', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  ref: {
    type: Sequelize.STRING
  },
  data: {
    type: Sequelize.STRING
  }
  }, {
    timestamps: false,
    tableName: 'mypay_items',
    freezeTableName: true,
    omitNull: true
  })
module.exports = MypayItem