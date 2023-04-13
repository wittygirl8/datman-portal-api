const {sequelizeInstance, Sequelize} = require('..')

const FeeTier = sequelizeInstance.define('fee_tier', {
    id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },

    name: {
      type: Sequelize.STRING,
      allowNull: false
    },

    minimum_transaction_value: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    maximum_transaction_value: {
      type: Sequelize.INTEGER,
      allowNull: false
    },

    percentage_fee: {
      type: Sequelize.DECIMAL(3,2),
      allowNull: false
    },

    fixed_fee: {
      type: Sequelize.DECIMAL(3,2),
      allowNull: false
    }
  },
  {
    timestamps: false,
    tableName: 'fee_tiers',
    freezeTableName: true
  })

module.exports = FeeTier
