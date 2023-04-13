const {sequelizeInstance, Sequelize} = require('../');

const PaymentTransactionDetails = sequelizeInstance.define('payment_transaction_details', {
    id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    payment_transaction_id : {
        type: Sequelize.BIGINT,
    },
    firstname: {
        type: Sequelize.STRING
    },
    lastname: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    origin: {
        type: Sequelize.STRING
    },
    method: {
        type: Sequelize.STRING
    }
}, {
    underscored: true,
    freezeTableName: true
})

module.exports = PaymentTransactionDetails;