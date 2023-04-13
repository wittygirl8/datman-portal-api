const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the user')
const Users = sequelizeInstance.define('users_w', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    first_name: {
        type: Sequelize.STRING,
        defaultValue: null 
    },
    last_name: {
        type: Sequelize.STRING,
        defaultValue: null 
    },
    email: {
        type: Sequelize.STRING,
        defaultValue: null 
    },
    phone: {
        type: Sequelize.STRING,
        defaultValue: null 
    },
    comments: {
            type: Sequelize.STRING,
            defaultValue: null    
    }
}, {
    underscored: true,
    freezeTableName: true
})

module.exports = Users