const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the optmany refund')

const OptmanyRefund = sequelizeInstance.define('optomany_refund', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    card_payment_id:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    reference:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    amount:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    outcome:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    reason:{   type: Sequelize.STRING,
        defaultValue: null

    }
}, {
    underscored: true,
    freezeTableName: true
})

module.exports = OptmanyRefund;