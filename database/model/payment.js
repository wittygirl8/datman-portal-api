const { sequelizeInstance, Sequelize } = require('../')

const Payment = sequelizeInstance.define('card_payment', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    order_id: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    firstname: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    lastname: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    more_info: {
        type: Sequelize.STRING,
    },
    address: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    email: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    total: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    fees: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    payed: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    VendorTxCode: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    VPSTxId: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    SecurityKey: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    CrossReference: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    week_no: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    day: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    month: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    year: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    payment_status: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    payment_provider: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    provider: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    ip: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    last_4_digits: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    time: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    withdraw_status: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    refund: {
        type: Sequelize.STRING,
        // defaultValue: null

    },
    TxAuthNo: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    delete_status: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    correlation_id: {
        type: Sequelize.STRING,
    },
    origin: {
        type: Sequelize.STRING,
    },
    method: {
        type: Sequelize.STRING,
    }
}, {
    timestamps: false,
    freezeTableName: true,
    omitNull: true

}
)
module.exports = Payment