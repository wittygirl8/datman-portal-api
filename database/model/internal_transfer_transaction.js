const { sequelizeInstance, Sequelize } = require('../')
const internalTransferTransaction = sequelizeInstance.define('internal_transfer_transaction', {

    ref: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    recipient_id: {
        type: Sequelize.INTEGER
    },
    customer_id: {
        type: Sequelize.INTEGER
    },
    amount: {
        type: Sequelize.DOUBLE
    },
    datman_fee: {
        type: Sequelize.DOUBLE
    },
    description: {
        type: Sequelize.TEXT
    },
    refunded: {
        type: Sequelize.ENUM,
        values: ['TRUE', 'FALSE']
    },
    status: {
        type: Sequelize.ENUM,
        values: ['PENDING', 'COMPLETE', 'CANCELED', 'REFUNDED', 'DISPUTING']
    },
    recurring: {
        type: Sequelize.TIME
    }
},
    {
        timestamps: false,
        freezeTableName: true,
        omitNull: true
    }
)

module.exports = internalTransferTransaction