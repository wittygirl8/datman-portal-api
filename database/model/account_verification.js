const {sequelizeInstance, Sequelize} = require('../')

const AccountVerification = sequelizeInstance.define('account_verification', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
      type: Sequelize.INTEGER
    },
    customer_notes: {
        type: Sequelize.STRING
    },
    uploaded_by: {
      type: Sequelize.STRING
    },
    system_info_id: {
      type: Sequelize.INTEGER
    },
    file_upload_version: {
      type: Sequelize.STRING
    }

}, {
      timestamps: false,
      freezeTableName: true
})

module.exports = AccountVerification