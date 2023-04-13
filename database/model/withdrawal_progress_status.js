const {sequelizeInstance, Sequelize} = require('../')

const WithdrawalProgressStatus = sequelizeInstance.define('withdrawal_progress_status', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
        type: Sequelize.INTEGER
    },
    status: {
      type: Sequelize.STRING
    },
    created_at: {
      type: 'TIMESTAMP'
    },
    updated_at: {
      type: 'TIMESTAMP'
    }
}, {
      timestamps: false,
      freezeTableName: true
})

module.exports = WithdrawalProgressStatus


