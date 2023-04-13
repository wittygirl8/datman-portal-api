const {sequelizeInstance, Sequelize} = require('../../database/')
const Customer = require('../../database/model/customers')
const InternalTransferTransaction = require('../../database/model/internal_transfer_transaction')
const InternalTransferRefund = require('../../database/model/internal_transfer_refund')
const customer = require('../../database/model/customers')
const crypto = require('crypto')
const Op = Sequelize.Op
/*
This function checks if the phone number belongs to customer table
if yes, then returns 'true'
*/

module.exports.getFee = () => {
  return sequelizeInstance.query("SELECT * FROM `internal_transfer_fee_structure`", { type: Sequelize.QueryTypes.SELECT})
}

module.exports.getSuppliers = () => {
  return Customer.findAll({
    attributes: ['id','business_name'], //object
    where: {
      is_supplier: 'TRUE',
      internal_transfer_status:'ENABLED',
      progress_status:'2'
    }
  });
}


module.exports.checkSenderStatus = (params) => {
  return Customer.findOne({
      attributes: ['internal_transfer_status','business_name','customers_email','clients_fname','clients_sname'], //object
      where: {id: params.merchant_id}
  });
}

module.exports.checksupplierStatus = (params) => {
  return Customer.findOne({
    attributes: ['internal_transfer_status','is_supplier','business_name','customers_email','clients_fname','clients_sname'], //object
    where: {id: params.supplier_id}
  });
}

module.exports.createInternalTransfer = (params) => {
  return InternalTransferTransaction.create({
    recipient_id: params.payload.supplier_id,
    customer_id: params.merchant_id,
    amount: params.payload.amount,
    description: params.payload.description
  })
}

module.exports.checkPassword = (params) => {
  return Customer.findOne({
    attributes: ['id'], //object
    where: {
      id: params.merchant_id,
      customer_password: crypto.createHash('md5').update(params.password).digest('hex')
    }
  });
}

module.exports.getTransactionsSender = (params) => {
  return InternalTransferTransaction.findAll({
    attributes: ['ref','recipient_id','customer_id','amount','description','refunded','status','created_at'], //object
    where: {
      customer_id: params.merchant_id
    },
    order: [
      ['ref', 'DESC']
    ]
  })
}

module.exports.getTransactionsSupplier = (params) => {
  return InternalTransferTransaction.findAll({
    attributes: ['ref','recipient_id','customer_id','amount','description','refunded','status','created_at'], //object
    where: {
      recipient_id: params.merchant_id
    },
    order: [
      ['ref', 'DESC']
    ]
  })
}

module.exports.getTransaction = (params) => {
  return InternalTransferTransaction.findOne({
    where: {
      ref: params.transaction_id
    }
  })
}

module.exports.updateTransactionStatus = (params) => {
  return InternalTransferTransaction.update(
    { 
        status : params.status
    },
    { where: {ref: params.transaction_id}
  });
}

module.exports.getCustomerNames = (params) => {
  return Customer.findAll({
    attributes: ['id','business_name'], //object
    where: {
      id: {
        [Op.in]: params.customer_ids
      }
    }
  });
}

module.exports.getRefundInfo = (params) => {
  return InternalTransferRefund.findAll({
    attributes: [['internal_transfer_transaction_ref','transaction_id'],[Sequelize.fn('SUM', Sequelize.col('amount')), 'refunded_amount']],
    where : {
      internal_transfer_transaction_ref : {
        [Op.in] : params.transaction_ids,
      }
    },
    group: ['internal_transfer_transaction_ref']
  });
}

module.exports.refundTransaction = (params) => {
  return InternalTransferRefund.create({
    internal_transfer_transaction_ref: params.transaction_id,
    refund_type: params.refund_type,
    amount : params.refund_amount,
    refunded_by: params.refunded_by
  });
}

module.exports.getAccountStatus = (params) => {

  return customer.findOne({
      attributes: ['status'],
      where : {
          id : params.customer_id
      },raw:true
  });
}