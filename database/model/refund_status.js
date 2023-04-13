
const { sequelizeInstance, Sequelize } = require('../')

const RefundStatus = sequelizeInstance.define('refund_status',{
    id: {
      autoIncrement: true,
      type: Sequelize.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    cardpayment_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      unique: "cardpayment_id"
    },
    status: {
      type: Sequelize.ENUM('REFUND-PROCESSED'),
      allowNull: true
    }
  }, {
    tableName: 'refund_status',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "cardpayment_id",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "cardpayment_id" },
        ]
      },
    ]
  }
)
module.exports = RefundStatus

