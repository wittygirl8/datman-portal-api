const {sequelizeInstance, Sequelize} = require('../')
const PdqTransactions = sequelizeInstance.define('pdq_transactions', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    order_id: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    merchant_id: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    total: {
        type: Sequelize.INTEGER,
        // defaultValue: null

    },
    date_time: {
        type: Sequelize.DATE,
        // defaultValue: new Date()
    },
    transaction_id: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    auth_code: {
        type: Sequelize.STRING
    },
    split_bill_id: {
        type: Sequelize.INTEGER
    },
    transaction_status_id: {
        type: Sequelize.INTEGER,
    },
    refund_status: {
        type: Sequelize.INTEGER,
    },
}, {
        underscored: true,
        freezeTableName: true,
        timestamps: false
        
})

module.exports = PdqTransactions