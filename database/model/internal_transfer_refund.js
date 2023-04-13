const { sequelizeInstance, Sequelize } = require('../')
const internal_transfer_transaction = require('./internal_transfer_transaction')
const internalTransferRefund = sequelizeInstance.define('internal_transfer_refund', {

    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    internal_transfer_transaction_ref: {
        type: Sequelize.INTEGER,
        defaultValue: null
        // references: {
        //     model: internal_transfer_transaction,
        //     key: 'ref'
        //     // constraints: false
        //   }
    },
    refund_type: {
        type: Sequelize.ENUM,
        values: ['FULL', 'PARTIAL']
    },
    amount: {
        type: Sequelize.DOUBLE,
        defaultValue: null
    },
    refunded_by: {
        type: Sequelize.ENUM,
        values: ['RECIPIENT','AGENT']
    }    
}, {
    timestamps: false,
    underscored: true,
    freezeTableName: true
})

module.exports = internalTransferRefund
