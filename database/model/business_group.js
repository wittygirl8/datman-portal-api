const {sequelizeInstance, Sequelize} = require('../')
console.log('creating the business_group')
const Country = require('./country')
const SecurityCredentials = require('./security_credentials')

const BusinessGroup = sequelizeInstance.define('business_group', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    host:{
        type: Sequelize.STRING,
        defaultValue: null
    },
    // security_credentials_id: {
    //     type: Sequelize.INTEGER,
    //     references: {
    //         model: SecurityCredentials,
    //         key: 'id',
    //         // constraints: false
    //       }
    // },
    country_id:{
        type: Sequelize.INTEGER,
        references: {
            model: Country,
            key: 'id',
            // constraints: false
          }
    }
}, {
        
        underscored: true,
        freezeTableName: true
})

module.exports = BusinessGroup;