const moment = require("moment-timezone");
const { Sequelize, sequelizeInstance } = require("../../database");
const balanceReconciliationsRequest = require("../../database/model/balance-csv-request-log");

module.exports.updateBalanceFetchRequestLog = async (params) => {
    
    return balanceReconciliationsRequest.create({
        customer_id: params.customerId,
        request_email: params.email
    });

};

module.exports.fetchBalanceData = async (params) => {

    // let month = moment.tz("Europe/London").month();
    // let year = moment.tz("Europe/London").year();

    return sequelizeInstance.query(`
    SELECT b.*,
        c.business_name business_name,
        case when c.status = 12 then '12' else '' end as watch_list_status,
        case when business_post_code != '' then business_post_code else customers_post_code end as postcode,
        case when c.is_supplier = TRUE then 'Supplier' else 'Merchant' end as client_type 
    FROM balance b join customers c on b.customer_id = c.id
    WHERE b.month = '${params.month}' AND b.year = '${params.year}' 
        AND c.country_id in (1,2) 
        AND c.business_name not like '%test%' and c.business_name not like '%F8 Live%' 
        AND c.progress_status in (2,3) 
    ORDER BY total_before_fees desc`,
        { type: Sequelize.QueryTypes.SELECT }
    )
};