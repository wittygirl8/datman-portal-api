const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the batchItem')

const batchItem = sequelizeInstance.define('batch_item', {
    batch_item_id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    batch_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    card_payment_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    date_issued: {
        type: Sequelize.TIME,
        allowNull: false
    },
    total: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    not_received: {
        type: Sequelize.INTEGER,
        allowNull: false
    }

}, {
    underscored: true,
    freezeTableName: true,
    timestamps: false
    
})

module.exports = batchItem