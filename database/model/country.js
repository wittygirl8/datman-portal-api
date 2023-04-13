const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the country')
const Country = sequelizeInstance.define('country', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    country_name: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    iso: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    phone_code: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    phone_code: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    inbound_phone_number: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    currency_name: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    currency_sign: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    created_by: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    country_flag_image_path: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    status: {
        type: Sequelize.ENUM,
        values: ['ACTIVE', 'INACTIVE']
    }

}, {
    underscored: true,
    // timestamps: false,
    freezeTableName: true
})

module.exports = Country


