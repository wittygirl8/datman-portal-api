
const {sequelizeInstance, Sequelize} = require('../')

const MypayCardstreamTransactionLog = sequelizeInstance.define('MypayCardstreamTransactionLog', {
  id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    action: {
      type: Sequelize.STRING
    },
    raw_response: {
      type: Sequelize.STRING
    },
    xref: {
      type: Sequelize.STRING
    }
    }, {
      timestamps: false,
      tableName: 'mypay_card_stream_transactions_log',
      freezeTableName: true,
      omitNull: true
})

module.exports = MypayCardstreamTransactionLog

