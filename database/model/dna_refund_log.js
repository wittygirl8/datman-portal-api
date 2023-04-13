const {sequelizeInstance, Sequelize} = require('../');

const DnaRefundLog = sequelizeInstance.define('dna_refund_log', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    payment_id : {
        type: Sequelize.INTEGER(11)
    },
    raw_data: {
        type: Sequelize.TEXT
    }
}, {
    underscored: true,
    freezeTableName: true
})

module.exports = DnaRefundLog;