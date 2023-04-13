const { sequelizeInstance, Sequelize } = require('../');
const PaymentTransaction = sequelizeInstance.define('payment_transaction', {
    id: {
        autoIncrement: true,
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true
    },
    merchant_id: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    order_id: {
        type: Sequelize.STRING(150),
        allowNull: false,
        defaultValue: ''
    },
    provider: {
        type: Sequelize.ENUM('T2S', 'FH', 'BF', 'DNA'),
        allowNull: true,
        defaultValue: 'T2S'
    },
    total: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: 'Total order value'
    },
    fees: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: 'Total bank fee charged by banks'
    },
    payed: {
        type: Sequelize.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0.0,
        comment: 'Total value after fees have been deducted'
    },
    refund: {
        type: Sequelize.TEXT,
        allowNull: true
    },
    cross_reference: {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: '',
        comment: 'Transaction refrence'
    },
    email: {
        type: Sequelize.STRING(100),
        allowNull: true
    },
    payment_status: {
        type: Sequelize.ENUM(
            'OK',
            'FAILED',
            'TOVOID',
            'UNTRIED',
            'INBATCH',
            'STRIPE-WITHDRAWAL',
            '3DS-PROGRESS',
            'DECLINE',
            'RISK-CHECK-DECLINE',
            'GATEWAY-TIMEOUT',
            'ERROR',
            'PENDING'
        ),
        allowNull: false,
        defaultValue: 'UNTRIED'
    },
    payment_provider: {
        type: Sequelize.ENUM(
            'BARCLAYS',
            'SAGEPAY',
            'CCAVENUE',
            'DATMANPAY',
            'JUDOPAY',
            'OPTOMANY',
            'STRIPE',
            'VOUCHER',
            'WALLET',
            'CARDSTREAM',
            'DNA'
        ),
        allowNull: false
    },
    last_4_digits: {
        type: Sequelize.STRING(4),
        allowNull: true
    },
    created_at: Sequelize.DATE,
    updated_at: Sequelize.DATE
}, {
    timestamps: false,
    freezeTableName: true,
    omitNull: true
})
module.exports = PaymentTransaction;
