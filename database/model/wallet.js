const {sequelizeInstance, Sequelize} = require('../')
const BusinessGroup = require('./business_group')

console.log('creating the wallet')
const Wallet = sequelizeInstance.define('wallet', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    fname: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    lname: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    refrence_id: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    business_group_id: {
        type: Sequelize.INTEGER,
        references: {
            model: BusinessGroup,
            key: 'id'
            // constraints: false
          }
    },
    balance: {
        type: Sequelize.STRING,
        defaultValue: '00'
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: null
    }
}, {
        underscored: true,
        freezeTableName: true
})

module.exports = Wallet