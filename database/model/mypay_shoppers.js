const { sequelizeInstance, Sequelize } = require('../')
const MypayShopper = sequelizeInstance.define('MypayShopper', {
  id: {
    type: Sequelize.INTEGER(11),
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
    },
    first_name: {
      type: Sequelize.STRING
    },
    last_name: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    address: {
      type: Sequelize.STRING
    },
    description : {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    recipients_email: {
      type: Sequelize.STRING(255),
      allowNull: true
    },
    }, {
      timestamps: false,
      tableName: 'mypay_shoppers',
      freezeTableName: true,
      omitNull: true
})
module.exports = MypayShopper