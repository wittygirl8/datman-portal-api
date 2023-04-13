const {sequelizeInstance, Sequelize} = require('../')

const Customers = sequelizeInstance.define('customers', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    balance: {
        type: Sequelize.FLOAT,
    },
    balance_updated: {
        type: 'TIMESTAMP'
    },
    date_created: {
        type: Sequelize.STRING
    },
    clients_fname: {
        type: Sequelize.STRING,
        // // defaultValue: null
    },
    clients_sname: {
        type: Sequelize.STRING,
        // // defaultValue: null
    },
    customer_password: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_email: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_email: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_mobile: {
        type: Sequelize.INTEGER,
        // defaultValue: null
    },
    business_phone_number:{
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_name: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_number: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_street: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_city: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    business_county: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_number: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_street: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_city: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_county: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    customers_post_code: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    stripe_sk: {                    // stripe secret key
        type: Sequelize.STRING,
        // defaultValue: null
    },
    stripe_pk: {                    // stripe publish key
        type: Sequelize.STRING,
        // defaultValue: null
    },
    stripe_whsec: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    stripe_acc_id: {
        type: Sequelize.STRING,
        // defaultValue: null       
    },
    business_post_code: {
        type: Sequelize.STRING,
    },
    currency: {
        type: Sequelize.STRING,
        // defaultValue: null
    },
    progress_status: {
        type: Sequelize.STRING
    },
    account_verification_status: {
        type: Sequelize.STRING
    },
    refresh_key: {
        type: Sequelize.STRING
    },
    internal_transfer_status: {
        type: Sequelize.STRING
    },
    enabled_withdrawal_once: {
        type: Sequelize.STRING
    },
    signup_link_from: {
        type: Sequelize.STRING
    },
    stripe_acc_type: {
        type: Sequelize.ENUM,
        values: ['EAT-APPY', 'DATMAN']
    },
    country_id: {
        type: Sequelize.INTEGER(11)
    },
    payment_provider: {
        type: Sequelize.STRING
    },
    customer_type: {
        type: Sequelize.STRING
    },    
    auto_withdraw: {
        type: Sequelize.INTEGER(11)
    },
    progress_date: {
        type: Sequelize.STRING
    },
    contract_rent: {
        type: Sequelize.STRING
    },
    contract_length: {
        type: Sequelize.STRING
    },
    notice_period: {
        type: Sequelize.STRING
    },
    setup_charged: {
        type: Sequelize.ENUM,
        values: ['TRUE', 'FALSE']
    },
    setup_fee: {
        type: Sequelize.STRING
    },
    extra_comments: {
        type: Sequelize.STRING
    },
    services_description: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.INTEGER(1)
    },
    ip_address: {
        type: Sequelize.STRING
    },
    fee_tier_id: {
        type: Sequelize.INTEGER(11)
    },
}, {
        timestamps: false,
        // underscored: true,
        freezeTableName: true
})

module.exports = Customers
