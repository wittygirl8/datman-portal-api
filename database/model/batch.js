const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the batch')

const batch = sequelizeInstance.define('batch', {
    batch_id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: false },
    total: { type: Sequelize.TEXT, allowNull: false },
    status: { type: Sequelize.ENUM, values: ['PENDING', 'SENT', 'COMPLETE','FAILED', 'FINALISED', 'DELETED'] },
    date_pending: { type: Sequelize.TIME, allowNull: false },
    date_sent: { type: Sequelize.TIME, allowNull: false },
    date_complete: { type: Sequelize.TIME, allowNull: false },
    week_no: { type: Sequelize.STRING, allowNull: false },
    not_received: { type: Sequelize.STRING, allowNull: false },
    not_received_date: { type: Sequelize.STRING, allowNull: false },
    account_number: { type: Sequelize.STRING, allowNull: false },
    sort_code: { type: Sequelize.STRING, allowNull: false },
    bank_name: { type: Sequelize.STRING, allowNull: false },
    account_holder: { type: Sequelize.STRING, allowNull: false },

}, {
    underscored: true,
    freezeTableName: true,
    timestamps: false
})

module.exports = batch

