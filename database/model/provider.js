const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the provider')
const Country = require('./country')

const Provider = sequelizeInstance.define('provider', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    host: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    api_key: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    country_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Country,
            key: 'id',
            constraints: false
        }
    }
}, {

    underscored: true,
    freezeTableName: true
})

module.exports = Provider;