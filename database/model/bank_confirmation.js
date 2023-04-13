const {sequelizeInstance, Sequelize} = require('../')

const BankConfirmation = sequelizeInstance.define('bank_confirmation', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
        type: Sequelize.INTEGER
    },
    sortcode_old: {
        type: Sequelize.STRING
    },
    accountnumber_old: {
        type: Sequelize.STRING
    },
    sortcode_new: {
        type: Sequelize.STRING
    },
    accountnumber_new: {
        type: Sequelize.STRING
    },
    bankname_new: {
        type: Sequelize.STRING
    },
    accountholder_new:{
        type: Sequelize.STRING
    },
    status:{
        type: Sequelize.STRING,
    },
    varify_bank_type: {
        type: Sequelize.STRING
    },
    file_upload_version: {
        type: Sequelize.STRING
    },
    bank_details:{
        type:Sequelize.TEXT,

    }

}, {
        timestamps: false,
        // underscored: true,
        freezeTableName: true
})

module.exports = BankConfirmation