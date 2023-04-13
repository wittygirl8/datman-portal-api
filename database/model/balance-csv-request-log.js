const { sequelizeInstance, Sequelize } = require('../')

const BalanceReconciliationsRequest = sequelizeInstance.define('balance_csv_request_log', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },
    request_email: {
        type: Sequelize.STRING(30),
        allowNull: false
    }

}, {
    timestamps: false,
    // underscored: true,
    freezeTableName: true
});

module.exports = BalanceReconciliationsRequest;