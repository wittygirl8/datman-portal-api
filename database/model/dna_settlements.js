const {sequelizeInstance, Sequelize} = require('../')
console.log('fetching the dna transactions')

const DnaSettlements = sequelizeInstance.define('dna_settlements', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    transaction_date: {
        type: Sequelize.STRING,
        allowNull: false
    },
    settlement_date: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    banking_date: {
        type: Sequelize.STRING,
        allowNull: false
    },
    merchant_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    amount: {
        type: Sequelize.STRING
    },
    currency: {
        type: Sequelize.STRING,
        allowNull: false
    },
    acquirer_fee: {
        type: Sequelize.STRING,
        allowNull: false
    },
    amount_to_merchant: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    transaction_id: {
        type: Sequelize.STRING,
        allowNull: false
    },
    card_scheme: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    card_mask: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    capture_method: {
        type: Sequelize.STRING,
        allowNull: false
    },
    provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "DNA",
    },
    issuer_country: {
        type: Sequelize.STRING,
        allowNull: false
    }
    },
    {
        timestamps: false,
        underscored: true,
        freezeTableName: true
    });

module.exports = DnaSettlements