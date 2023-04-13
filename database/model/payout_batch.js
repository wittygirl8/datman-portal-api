/** @format */

const { sequelizeInstance, Sequelize } = require("../");
console.log("creating the payout batch");

const payoutBatch = sequelizeInstance.define(
  "payout_batch",
  {
    batch_id: {
      type: Sequelize.INTEGER(11),
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    customer_id: { type: Sequelize.INTEGER, allowNull: true },
    total: { type: Sequelize.TEXT, allowNull: true },
    status: {
      type: Sequelize.ENUM,
      values: ["PENDING", "SENT", "COMPLETE", "FINALISED", "DELETED", "FAILED"],
    },
    date_pending: { type: Sequelize.TIME, allowNull: false },
    date_sent: { type: Sequelize.TIME, allowNull: false },
    date_complete: { type: Sequelize.TIME, allowNull: false },
    week_no: { type: Sequelize.STRING, allowNull: true },
    not_received: { type: Sequelize.STRING, allowNull: true },
    not_received_date: { type: Sequelize.STRING, allowNull: true },
    account_number: { type: Sequelize.STRING, allowNull: true },
    sort_code: { type: Sequelize.STRING, allowNull: true },
    bank_name: { type: Sequelize.STRING, allowNull: true },
    account_holder: { type: Sequelize.STRING, allowNull: true },
    updated_at: { type: Sequelize.TIME, allowNull: false },
    pp_token: { type: Sequelize.STRING, allowNull: true },
  },
  {
    underscored: true,
    freezeTableName: true,
    timestamps: false,
  }
);

module.exports = payoutBatch;
