const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the hosted_forms')

const HostedForms = sequelizeInstance.define('HostedForms', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    uuid: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: null
    },
    invoice_id: {
        type: Sequelize.STRING,
        allowNull: true
    },
    invoice_expiry_date:{
        type: Sequelize.DATE,
        allowNull: true
    },
    html: {
        type: Sequelize.TEXT,
        defaultValue: null
    },
    pay_by_link_details: {
        type: Sequelize.TEXT,
        defaultValue: null
    },
    created_at: {
        type: Sequelize.DATE,
    },
    updated_at:{
        type: Sequelize.DATE
    }

}, {
    underscored: true,
    // timestamps: false,
    tableName: 'hosted_forms',
    freezeTableName: true
})

module.exports = HostedForms;


