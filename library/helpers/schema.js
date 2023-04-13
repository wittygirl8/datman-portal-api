const Joi = require('@hapi/joi');
const JoiDate = require('@hapi/joi-date');

module.exports.mypayCreateCustomerPayloadSchema = Joi.object({
  customerName: Joi.string().required(),
  contactName: Joi.string().required(),
  contactAddress: Joi.string().required(),
  contactTown: Joi.string().required(),
  contactCounty: Joi.string().required(),
  contactPostcode: Joi.string().required(),
  contactPhone: Joi.string().required(),
  contactEmail: Joi.string().email().required(),
  contactCountryCode: Joi.string(),
  companyType: Joi.string(),
  status: Joi.string(),

  merchantName: Joi.string().required(),
  url: Joi.string().uri().required(),
  testMode: Joi.string().required(),
  threeDSEnabled: Joi.string().required(),
  threeDSRequired: Joi.string().required(),
  acquirerBankName: Joi.string().required(),
  processorMerchantID: Joi.string(),
  processorID: Joi.string().required(),
  supportedCurrencies: Joi.string(),
  notifyEmail: Joi.string().email().required(),
  tid: Joi.string().allow(null, ''),
  merchantCategoryCode: Joi.string().required()
});

module.exports.mypayCreateMerchantPayloadSchema = Joi.object({
  status: Joi.string(),
  merchantName: Joi.string().required(),
  url: Joi.string().uri().required(),
  testMode: Joi.string().required(),
  threeDSEnabled: Joi.string().required(),
  threeDSRequired: Joi.string().required(),
  acquirerBankName: Joi.string().required(),
  processorMerchantID: Joi.string(),
  processorID: Joi.string().required(),
  supportedCurrencies: Joi.string(),
  notifyEmail: Joi.string().email().required(),
});


module.exports.createSessionSchema = Joi.object({
  amount: Joi.number().positive(),
  currency_code: Joi.number().allow(''),
  user_order_ref: Joi.string().empty(''),
  description: Joi.string().empty(''),
  items: Joi.array(),
  shoppers: Joi.object().keys(
    {
      first_name: Joi.string().empty(''),
      last_name: Joi.string().empty(''),
      email: Joi.string().email({ tlds: { allow: false } }).required().error(() => new Error('Please provide valid email')),
      recipients_email: Joi.string().email().allow(null, ''),
      address: Joi.string().empty('')
    }
  ),
  invoiceExpiryDate: Joi.date().empty(''),
  invoiceId: Joi.string().empty('')
});


module.exports.chargeBackPayloadSchema = Joi.object({
  transaction_id: Joi.number().positive().strict().required(),
  date: Joi.date().min('1-1-1947').required(),
  reason: Joi.string().max(250).required().valid(
    'Goods or services not received',
    'Transaction not recognised',
    'Duplicate Payment',
    'Defective goods',
    'Other'),
  status: Joi.string().valid('RESOLVED', 'NOTRESOLVED').required(),
  comments: Joi.string().allow(null, '')
});


module.exports.listChargeBackPaylaodSchema = Joi.object({
  month: Joi.number().strict(),
  year: Joi.number().strict(),
});

module.exports.chargeBackTransactionSchema = Joi.object({
  date: Joi.extend(JoiDate).date().format('DD/MM/YYYY').required(),
  amount: Joi.number().positive().precision(2).required(),
});

module.exports.chargeBackFetchDetailsSchema = Joi.object({
  transaction_id: Joi.number().positive().strict().required(),
  customer_id :Joi.string().required(),
});

module.exports.createSpecialRentPayloadSchema = Joi.object({
  start_date: Joi.extend(JoiDate).date().format('YYYY-MM-DD').required(),
  end_date: Joi.extend(JoiDate).date().format('YYYY-MM-DD').required(),
  rent_amount: Joi.number().positive().precision(2).required(),
  description: Joi.string().valid('Trial period', 'Special Offer', 'Others').required()
});

module.exports.deleteSpecialRentPayloadSchema = Joi.object({
  rent_id: Joi.number().strict().required()
});
module.exports.getLargePaymentSchema = Joi.object({
  day: Joi.number().positive().strict().max(31),
  month: Joi.number().positive().strict().max(12),
  year: Joi.number().positive().strict().required(),
  pageNumber: Joi.number().strict(),
});
module.exports.addCreditSchema = Joi.object({
  // merchant_id :Joi.string().required(),
  credit_amount: Joi.number().positive().strict().precision(2).required(),
  customer_name: Joi.string().max(50).required(),
  address: Joi.string().max(150).allow(null, ''),
  credit_reason: Joi.string().max(150).required(),
});
module.exports.searchRefundSchema = Joi.object({
  day: Joi.number().strict(),
  month: Joi.number().strict().required(),
  year: Joi.number().strict().required(),
});
module.exports.refundStatusSchema = Joi.object({
  payment_id: Joi.number().strict().required(),
  status: Joi.string().valid('REFUND-PROCESSED').required(),
});
module.exports.markWithdrawalsSchema = Joi.object({
  batch_id: Joi.number().strict().required(),
  status: Joi.string().valid('NOT-RECEIVED','RESEND','CANCEL').required()
});

module.exports.withdrawalsNotBatchedSchema = Joi.object({
  payment_id: Joi.number().strict().required(),
  user_deleted: Joi.string().required()
});

module.exports.createContractSchema = Joi.object({
  progress_status: Joi.string().valid('Active', 'Dormant').required(),
  contract_rent: Joi.number().positive().strict().precision(2).required(),
  contract_length: Joi.number().positive().integer().max(12).strict().required(),
  notice_period: Joi.number().positive().integer().strict().required(),
  setup_charged: Joi.boolean().valid(true, false).required(),
  setup_fee: Joi.number().min(0).strict().precision(2).when('setup_charged', { is: true, then: Joi.number().required().positive().strict().precision(2), otherwise: Joi.optional() }),
  extra_comments: Joi.string().max(200).allow(null, ''),
  services_description: Joi.string().max(100).allow(null, '')
});

module.exports.paymentFeeDetails = Joi.object({
  payment_id: Joi.number().strict().required(),
  payment_provider: Joi.string().required(),
});

module.exports.checkCustomerPhone = Joi.object({
  From: Joi.string().required(),
});