const {sequelizeInstance, Sequelize} = require('../')
console.log('creating the transaction')
const Account = require('./account')
const Provider = require('./provider')
const Transaction = sequelizeInstance.define('transaction', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    type: {
        type: Sequelize.ENUM,
        values: ['VOUCHER', 'TOPUP', 'REFUND', 'WITHDRAW']
    },
    amount: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    currency: {
        type: Sequelize.STRING,
        defaultValue: null
    },
    buisness_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Account,
            key: 'id',
            constraints: false
          }
    },
    buisness_group_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Provider,
            key: 'id',
            constraints: false
          }
    },
    state: {
        type: Sequelize.ENUM,
        values: ['PROCESSING', 'OK']
    },
    payment_ref: {
        type: Sequelize.STRING,
        defaultValue: null 
    }
}, {
        underscored: true,
        freezeTableName: true
})

module.exports = Transaction

// CREATE TABLE IF NOT EXISTS `transaction` (`id` INTEGER(11) NOT NULL auto_increment , `type` ENUM('VOUCHER', 'TOPUP', 'REFUND', 'WITHDRAW'), `amount` VARCHAR(255) DEFAULT NULL, `currency` VARCHAR(255) DEFAULT NULL, `acccount_id` INTEGER, `provider_id` INTEGER, `state` ENUM('PROCESSING', 'OK'), `payment_ref` VARCHAR(255) DEFAULT NULL, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL, PRIMARY KEY (`id`), FOREIGN KEY (`acccount_id`) REFERENCES `account` (`id`), FOREIGN KEY (`provider_id`) REFERENCES `Provider` (`id`)) ENGINE=InnoDB;