const { sequelizeInstance, Sequelize } = require('../')
const Invoice = sequelizeInstance.define('invoice', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
        type: Sequelize.INTEGER,
        // defaultValue: null
    },
    date_sent: {
        type: Sequelize.DATE,
        // defaultValue: null
    },
    date_due: {
        type: Sequelize.DATE,
        // defaultValue: null

    },
    amount: {
        type: Sequelize.FLOAT,
        // defaultValue: new Date()
    },
    paid_status: {
        type: Sequelize.INTEGER,
        // defaultValue: null
    },
    week_id: {
        type: Sequelize.INTEGER
    },
    letter_status: {
        type: Sequelize.INTEGER
    },
    print_status: {
        type: Sequelize.INTEGER
    },
    payment_method: {
        type: Sequelize.INTEGER
    },
    service_description: {
        type: Sequelize.TEXT
    },
    date_paid: {
        type: Sequelize.DATE
    }


}, {
    underscored: true,
    freezeTableName: true,
    timestamps: false

})

module.exports = Invoice