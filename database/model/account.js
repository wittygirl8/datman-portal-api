const {sequelizeInstance, Sequelize} = require('../')
const Users = require('./users')
const Provider = require('./provider')
console.log('creating the account')
const Account = sequelizeInstance.define('account', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    client_ref_id: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    api_key: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    user_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Users,
            key: 'id',
            // constraints: false
          }
    },
    provider_id:{
        type: Sequelize.INTEGER,
        references: {
            model: Provider,
            key: 'id',
            // constraints: false
          }
    },
    account_type: {  
        type: Sequelize.ENUM,
        // store : money would be hold by the provider and paid to stores on some set frequency.
        // Enduser: he manage the wallet himself.
        // Individual: having one store can be treated individuals.
        
        values: ['STORE', 'END_USER', 'INDIVIDUAL']
    },
    balance: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    status: {
        type: Sequelize.STRING,
        defaultValue: null
    }
}, {
        underscored: true,
        freezeTableName: true
})

module.exports = Account