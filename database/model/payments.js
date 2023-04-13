const { sequelizeInstance, Sequelize } = require('../')

const Payments = sequelizeInstance.define(
    'Payments',
    {
        id: {
            type: Sequelize.INTEGER(11),
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
        country_code: {
            type: Sequelize.STRING
        },
        gross: {
            type: Sequelize.DECIMAL
        },
        fee: {
            type: Sequelize.DECIMAL
        },
        net: {
            type: Sequelize.DECIMAL
        },
        currency_code: {
            type: Sequelize.STRING
        },
        payment_provider_id: {
            type: Sequelize.INTEGER
        },
        transaction_time: {
            type: Sequelize.TIME
        },
        transaction_status_id: {
            type: Sequelize.INTEGER
        },
        reason: {
            type: Sequelize.STRING
        },
        withdrawn_status: {
            type: Sequelize.INTEGER
        },
        source_ip: {
            type: Sequelize.STRING
        },
        last_4_digits: {
            type: Sequelize.STRING(4)
        },
        firstname: {
            type: Sequelize.STRING(60)
        },
        lastname: {
            type: Sequelize.STRING(60)
        },
        email_address: {
            type: Sequelize.STRING
        },
        address: {
            type: Sequelize.STRING
        },
        refund_reason_id: {
            type: Sequelize.INTEGER
        },
        delete_status: {
            type: Sequelize.INTEGER
        },
        psp_reference: {
            type: Sequelize.STRING
        },
        internal_reference: {
            type: Sequelize.STRING
        },
        day: {
            type: Sequelize.INTEGER
        },
        week: {
            type: Sequelize.INTEGER
        },
        month: {
            type: Sequelize.INTEGER
        },
        year: {
            type: Sequelize.INTEGER
        },
        transaction_mode_id: {
            type: Sequelize.INTEGER
        },
        transaction_method_id: {
            type: Sequelize.INTEGER
        },
        TxAuthNo: {
            type: Sequelize.STRING
        }
    },
    {
        timestamps: false,
        tableName: 'payments',
        freezeTableName: true,
        omitNull: true
    }
);


module.exports = Payments