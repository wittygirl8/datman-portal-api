const {sequelizeInstance, Sequelize} = require('../')

const BankValidationKey = sequelizeInstance.define('bank_validation_key', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    api_key: {
      type: Sequelize.STRING
    },
    validation_log_id: {
      type: Sequelize.INTEGER
    },
    customer_id: {
        type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.STRING
    },
    created_at: {
      type: 'TIMESTAMP'
    },
}, {
      timestamps: false,
      freezeTableName: true
})

module.exports = BankValidationKey

