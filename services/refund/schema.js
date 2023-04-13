const Joi = require('@hapi/joi');

module.exports.RefundHistoryPayloadSchema = Joi.object({
  payment_id: Joi.number().required(),
  payment_provider: Joi.string(),
  TxnReference: Joi.string()
});