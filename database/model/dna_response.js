const {sequelizeInstance, Sequelize} = require('../');

const DnaResponse = sequelizeInstance.define('dna_response_logs', {
    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    order_id : {
        type: Sequelize.STRING
    },
    dna_response: {
        type: Sequelize.STRING
    }
}, {
        underscored: true,
        freezeTableName: true
})

module.exports = DnaResponse;