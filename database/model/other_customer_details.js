const {sequelizeInstance, Sequelize} = require('../')

const OtherCustomerDetails = sequelizeInstance.define('other_customer_details', {
    other_customer_details_id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    txtBAddressLine1: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    txtBAddressLine2: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    txtBCity: {
        type: Sequelize.STRING,
        // defaultValue: null
    },

    ddlBCountry: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    txtBPostcode: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_id: {
        type: Sequelize.STRING,

    },
    txtWebSiteURL: {
        type: Sequelize.STRING,
    },
    accountnumber: {
        type: Sequelize.STRING
    },
    bankname: {
        type: Sequelize.STRING
    },
    accountholder: {
        type: Sequelize.STRING
    },
    sortcode: {
        type: Sequelize.STRING
    },
    ddlBusinessType: {
        type: Sequelize.STRING
    }
}, {
        timestamps: false,
        // underscored: true,
        freezeTableName: true
})

module.exports = OtherCustomerDetails