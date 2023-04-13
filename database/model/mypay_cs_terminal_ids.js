const { sequelizeInstance, Sequelize } = require('../');

const MypayCsTerminalIds = sequelizeInstance.define('mypay_cs_terminal_ids', {
    id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    uid: {
      type: Sequelize.STRING,
      defaultValue: null
    },
    tid: {
      type: Sequelize.STRING,
      defaultValue: null
    },
    customer_id: {
      type: Sequelize.STRING,
      defaultValue: null
    },
    cs_merchant_id: {
      type: Sequelize.INTEGER(11),
      defaultValue: null
    },
    acquirer: {
      type: Sequelize.STRING,
      defaultValue: 2  // Why this value to be  default to 2 ?
    },
    status: {
      type: Sequelize.ENUM,
      values: ['NEW', 'PROCESSING', 'REGISTERED'],
      defaultValue: 'NEW'
    }
  },
  {
    timestamps: true,
    tableName: 'mypay_cs_terminal_ids',
    freezeTableName: true,
    underscored: true,


  }

);
module.exports = MypayCsTerminalIds;
