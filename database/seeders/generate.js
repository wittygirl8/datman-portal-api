const DATA_SIZE = 100
const faker = require('faker');
const db = require('./db')
Sequelize = db.Sequelize
sequelize = db.sequelize

const customer1 = sequelize.define('customer2', {
    // attributes
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    business_name: {
        type: Sequelize.STRING
    },
    balance: {
        type: Sequelize.STRING
    },
    balance_updated: {
        type: Sequelize.STRING
    },
    config_id: {
        type: Sequelize.STRING
    },
    signup_link_from: {
        type: Sequelize.STRING
    },
    date_created: {
        type: Sequelize.STRING
    },
    clients_fname: {
        type: Sequelize.STRING
    },
    clients_sname: {
        type: Sequelize.STRING
    },
    customer_id: {
        type: Sequelize.STRING
    },
    business_number: {
        type: Sequelize.STRING
    },
    business_street: {
        type: Sequelize.STRING
    },
    business_city: {
        type: Sequelize.STRING
    },
    business_country: {
        type: Sequelize.STRING
    },
    business_post_code: {
        type: Sequelize.STRING
    },
    business_phone_number: {
        type: Sequelize.STRING
    },
    business_email: {
        type: Sequelize.STRING
    },
    customer_number: {
        type: Sequelize.STRING
    },
    customer_street: {
        type: Sequelize.STRING
    },
    customer_city: {
        type: Sequelize.STRING
    },
    customer_county: {
        type: Sequelize.STRING
    },
    customer_post_code: {
        type: Sequelize.STRING
    },
    customer_mobile: {
        type: Sequelize.STRING
    },
    customer_email: {
        type: Sequelize.STRING
    },
    customer_password: {
        type: Sequelize.STRING
    },
    customer_level: {
        type: Sequelize.STRING
    },
    contract_rent: {
        type: Sequelize.STRING
    },
    notice_period: {
        type: Sequelize.STRING
    },
    contract_length: {
        type: Sequelize.STRING
    },
    notice_period: {
        type: Sequelize.STRING
    },
    setup_charged: {
        type: Sequelize.STRING
    },
    setup_fee: {
        type: Sequelize.STRING
    },
    extra_comments: {
        type: Sequelize.STRING
    },
    service_description: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.STRING
    },
    progress_status: {
        type: Sequelize.STRING
    },
    progress_date: {
        type: Sequelize.STRING
    },
    agree: {
        type: Sequelize.STRING
    },
    ip_address: {
        type: Sequelize.STRING
    },
    VPSTxId: {
        type: Sequelize.STRING
    },
    SecurityKey: {
        type: Sequelize.STRING
    },
    TxAuthNo: {
        type: Sequelize.STRING
    },
    bank_verification_status: {
        type: Sequelize.STRING
    },
    account_verification_status: {
        type: Sequelize.STRING
    },
    internal_trasfer_status: {
        type: Sequelize.STRING
    },
    is_supplier: {
        type: Sequelize.STRING
    },
    application_complete: {
        type: Sequelize.STRING
    },
    signature_token: {
        type: Sequelize.STRING
    }
}, {timestamps: false});



customer1.sync({ force: true }).then(() => {
    for (let i = 0; i <= DATA_SIZE; i++) {


        let id = faker.finance.account(8);
        let business_name = faker.company.companyName()
        let balance = faker.finance.amount(0, 1500, 2)
        // let balance_updated = faker.date.recent(10);
        let balance_updated = ""
        let config_id = faker.finance.account(6);
        let signup_link_from = faker.random.arrayElement(["MS-NEW", "WEB-NEW", "MS", "WEB"])
        // let date_created = faker.date.recent(10)
        let date_created = ""
        let clients_fname = faker.name.firstName(1);
        let clients_sname = faker.name.lastName(1);
        let customer_id = null
        let business_number = faker.random.arrayElement(["57", "shop2", "", "WEB", ""])
        let business_street = faker.address.streetName()
        let business_city = faker.address.city()
        let business_post_code = faker.address.zipCode()
        let business_phone_number = faker.phone.phoneNumber()
        let business_email = faker.internet.email(faker.name.firstName(1), faker.name.lastName(1));
        let customer_number = faker.phone.phoneNumber()
        let customer_street = faker.address.streetName()
        let customer_city = faker.address.city()
        let customer_county = faker.address.state()
        let customer_post_code = faker.address.zipCode()
        let customer_mobile = faker.phone.phoneNumber()
        let customer_email = faker.internet.email(faker.name.firstName(1), faker.name.lastName(1));
        let customer_password = '80086cf628066ff7823466c8552c07d4'
        let customer_level = '10'
        let contract_rent = faker.random.arrayElement(["10", "15", "18", "20", "0"])
        let contract_length = '12'
        let notice_period = '30'
        let setup_fee = faker.random.arrayElement(["150", "300", "0"])
        let setup_charged = faker.random.arrayElement(["TRUE", ""])
        let extra_comments = ""
        let service_description = "Data and Merchant Management Services"
        let staus = faker.random.arrayElement(["1", "0"])
        let progress_status = faker.random.arrayElement(["0", "3", "2", "10"])
        // let progress_date = faker.date.recent(100);
        let progress_date = ""
        let agree = ""
        let ip_address = ""
        let VPSTxId = ""
        let SecurityKey = ""
        let TxAuthNo = ""
        let bank_verification_status = faker.random.arrayElement(["VERIFY-LATER", "NOT-VERIFIED", "VERIFIED"])
        let account_verification_status = faker.random.arrayElement(["VERIFY-LATER", "NOT-VERIFIED", "VERIFIED"])
        let internal_trasfer_status = faker.random.arrayElement(["ENABLED", "DISABLED"])
        let is_supplier = "FALSE"
        let application_complete = "1"
        let signature_token = ""
        
        customer1.create({
            id,
            business_name,
            balance,
            balance_updated,
            config_id,
            signup_link_from,
            date_created,
            clients_fname,
            clients_sname,
            customer_id,
            business_number,
            business_street,
            business_city,
            business_post_code,
            business_phone_number,
            business_email,
            customer_number,
            customer_street,
            customer_city,
            customer_county,
            customer_post_code,
            customer_mobile,
            customer_email,
            customer_password,
            customer_level,
            contract_rent,
            contract_length,
            notice_period,
            setup_fee,
            setup_charged,
            extra_comments,
            service_description,
            staus,
            progress_status,
            progress_date,
            agree,
            ip_address,
            VPSTxId,
            SecurityKey,
            TxAuthNo,
            bank_verification_status,
            account_verification_status,
            internal_trasfer_status,
            is_supplier,
            application_complete,
            signature_token
        })
    }

})