const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the voucher')
const Provider= require('./provider')
const Voucher = sequelizeInstance.define('voucher', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    code: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    value: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    currency: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    provider_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Provider,
            key: 'id',
            // constraints: false
          }
        
    },
    deduction_type: {  //upfront or afteruse
        type: Sequelize.ENUM,
        values: ['UPFRONT', 'ONUSE']
    },
    exp_date: {
        type: Sequelize.STRING,
        defaultValue: null
    }
}, {
    underscored: true,
    freezeTableName: true
})

module.exports = Voucher