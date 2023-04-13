const Customer = require("../../database/model/customers");
const Customers = require('../../database/model/customers');
const { sequelizeInstance, Sequelize } = require('../../database')
const CustomerSpecialRent = require('../../database/model/customer_special_rent');

module.exports.getContract = (params) => {
  return Customer.findOne({
    attributes: [
      'progress_status',
      'contract_rent',
      'contract_length',
      'notice_period',
      'setup_charged',
      'setup_fee',
      'extra_comments',
      'services_description'
    ],
    where: { id: params.merchant_id }
  });
}

module.exports.checkContractRent = (params) => {
  return Customers.findOne({
    attributes: ['contract_rent'],
    where: {
      id: params.merchant_id
    }
  })
}

module.exports.getSpecialRent = (params) => {
  const query = `
          SELECT
              *,
              (
              CASE WHEN (CURRENT_DATE() BETWEEN start_date
              AND end_date) THEN
              'ACTIVE'
              WHEN (CURRENT_DATE() > end_date) THEN
              'INACTIVE'
              ELSE 'PENDING'
              END) AS status
          FROM
              customer_special_rent
          WHERE
              customer_id = :merchant_id
              AND active_status = 'ACTIVE'
           ORDER BY
              id DESC;
 `;

  return sequelizeInstance.query(query, {
    replacements: {
      merchant_id: params.merchant_id
    },
    type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.createSpecialRent = (params) => {
  return CustomerSpecialRent.create(params);
}

module.exports.getExistingSpecialRentDate = (params) => {
  const query = `
  SELECT start_date,end_date FROM customer_special_rent
  WHERE active_status = 'ACTIVE'
  AND customer_id = :merchant_id
  `;
  return sequelizeInstance.query(query, {
    replacements: {
      merchant_id: params.merchant_id
    },
    type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.getExistingSpecialRentUpdate = (params) => {
  const query = `SELECT id,start_date,end_date FROM customer_special_rent WHERE active_status = 'ACTIVE' AND customer_id = :customer_id AND ('${params.start_date}' <= start_date AND '${params.end_date}' >= start_date OR '${params.start_date}' >= start_date AND '${params.end_date}' <= end_date OR '${params.start_date}' <= end_date AND '${params.end_date}' >= end_date)`;
  return sequelizeInstance.query(query, {
    replacements: {
      customer_id: params.merchant_id
    },
    type: Sequelize.QueryTypes.SELECT
  });
};

module.exports.updateSpecialRent = (params) => {
  return CustomerSpecialRent.update({
    rent_amount: params.rent_amount,
    start_date: params.start_date,
    end_date: params.end_date,
    description: params.description
  }, { where: { id: params.rent_id } })
};

module.exports.getRentDetails = (params) => {
  const query = `
  SELECT id, customer_id, user_added, active_status, description, start_date, end_date FROM customer_special_rent
  WHERE active_status = 'ACTIVE'
  AND id = :rent_id
  LIMIT 1
  `;
  return sequelizeInstance.query(query, {
    replacements: {
      rent_id: params.rent_id
    },
    type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.deleteSpecialRent = (params) => {
  return CustomerSpecialRent.destroy({
    where: {
      id: params.rent_id
    }
  })
};

module.exports.updateContract = (params) => {
  console.log('updateContract', params)
  return Customer.update({
    progress_status: params.progress_status,
    progress_date: params.progress_date,
    contract_rent: params.contract_rent,
    contract_length: params.contract_length,
    notice_period: params.notice_period,
    setup_charged: params.setup_charged,
    setup_fee: params.setup_fee,
    extra_comments: params.extra_comments,
    services_description: params.services_description,
    status: '1',
  },
    {
      where: {
        id: params.merchant_id
      }
    });
}


module.exports.getInvoice = (params) => {
  const query = `SELECT 1 FROM invoice  WHERE service_description like '%setup%' and customer_id = :customer_id`;
  return sequelizeInstance.query(query, {
    replacements: {
      customer_id: params.merchant_id
    }, type: Sequelize.QueryTypes.SELECT
  });
}

module.exports.pushInvoiceAndCardInfo = async (params) => {
  console.log('pushInvoiceAndCardInfo', params)
  try {
    const invoiceQuery = `
                INSERT into invoice set
                        customer_id = :customer_id,
                        date_sent = :date_sent,
                        date_due = :date_due,
                        amount = :amount,
                        paid_status = '1',
                        week_id = :week_id,
                        payment_method = 'online',
                        service_description = :service_description`;
    await sequelizeInstance.query(invoiceQuery, {
      replacements: {
        customer_id: params.merchant_id,
        date_sent: params.date_sent,
        date_due: params.date_due,
        amount: params.amount,
        week_id: params.week_id,
        service_description: params.description
      }, type: Sequelize.QueryTypes.INSERT
    });

    let setupFee = `-${params.setup_fee}`;
    const cardQuery = `
                insert into card_payment (customer_id, ip, firstname, total, payed, withdraw_status, payment_status, year,month )
                            values ('${params.merchant_id}', '${params.ip}', '${params.description}', '${setupFee}', '${setupFee}', '1', 'OK','${params.year}',${params.month});
              `;
    return sequelizeInstance.query(cardQuery, {
      type: Sequelize.QueryTypes.INSERT
    });


  } catch (e) {
    console.log('error updating invoice', e);
  }
}
