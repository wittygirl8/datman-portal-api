const { sequelizeInstance, Sequelize } = require('..')

const PaymentSplitCommission = sequelizeInstance.define(
    'PaymentSplitCommission',
    {
        id: {
            type: Sequelize.INTEGER(20),
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        order_ref: {
            type: Sequelize.STRING
        },
        merchant_id: {
            type: Sequelize.INTEGER
        },
        partner_merchant_id: {
            type: Sequelize.INTEGER
        },
        partner_payments_id: {
            type: Sequelize.INTEGER
        },
        merchant_payments_id: {
            type: Sequelize.INTEGER
        },
        amount: {
            type: Sequelize.INTEGER
        },
        amount_refunded: {
            type: Sequelize.INTEGER
        },
        fee_type: {
            type: Sequelize.STRING
        },
        fee_value: {
            type: Sequelize.STRING
        },
        commission_type_id: {
            type: Sequelize.INTEGER
        },
        payment_status: {
            type: Sequelize.INTEGER
        }
    },
    {
        timestamps: false,
        tableName: 'payments_split_commission',
        freezeTableName: true,
        omitNull: true
    }
);


module.exports = PaymentSplitCommission