const FeeTier = require("../../database/model/fee_tiers");
const { Sequelize } = require("../../database");

module.exports.maxFeeTierId = () => {
  return FeeTier.findOne({
    attributes: [[Sequelize.fn("MAX", Sequelize.col("id")), "max_id"]],
    raw: true,
  });
};

module.exports.createFeeTier = (params, id) => {
  const tierId = id + 1;
  return FeeTier.create({
    percentage_fee: params.percentageFee,
    fixed_fee: params.fixedFee,
    name: "tier_" + tierId,
    minimum_transaction_value: 0,
    maximum_transaction_value: 0,
  });
};
