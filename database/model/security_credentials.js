const { sequelizeInstance, Sequelize } = require('../')
const BusinessGroup = require('./business_group')
console.log('creating the SecurityCredentials')
const SecurityCredentials = sequelizeInstance.define('security_credentials', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    access_key: {
        type: Sequelize.STRING,
        defaultValue: null 
    },
    secret_key: {
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
    type: {
        type: Sequelize.ENUM,
        values: ['TEST', 'LIVE']
    }   

}, {
    underscored: true,
    freezeTableName: true
})

module.exports = SecurityCredentials