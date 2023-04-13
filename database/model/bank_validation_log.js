const {sequelizeInstance, Sequelize} = require('../')

const BankValidationlog = sequelizeInstance.define('bank_validation_log', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
      type: Sequelize.INTEGER
    },
    feature_name: {
        type: Sequelize.STRING
    },
    feature_reference_id: {
      type: Sequelize.INTEGER
    },
    account_number: {
      type: Sequelize.STRING
    },
    sortcode: {
      type: Sequelize.STRING
    },
    validation_status: {
      type: Sequelize.STRING
    },
    api_response: {
      type: Sequelize.STRING
    },
    bank_details_new: {
      type: Sequelize.STRING
    }
}, {
      timestamps: false,
      freezeTableName: true
})

module.exports = BankValidationlog

