/** @format */

const { sequelizeInstance, Sequelize } = require("../");
const payoutBatch = require('./payout_batch')

const payoutBatchItem = sequelizeInstance.define(
  "payout_batch_item",
  {
    batch_item_id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: true },
    batch_id: { type: Sequelize.INTEGER, allowNull: true },
    total: { type: Sequelize.TEXT, allowNull: true },
    card_payment_id: { type: Sequelize.INTEGER, allowNull: true },
    not_received:{ type: Sequelize.BOOLEAN, allowNull:true , default: false},
    date_issued: { type: Sequelize.TIME, allowNull: false },
    updated_at: { type: Sequelize.TIME, allowNull: false },
  },
  {
    underscored: true,
    freezeTableName: true,
    timestamps: false,
  }
);

payoutBatch.hasMany(payoutBatchItem, { foreignKey: 'batch_id' });
payoutBatchItem.belongsTo(payoutBatch, { foreignKey: 'batch_id' });
module.exports = payoutBatchItem;