
const DATA_SIZE = 100
const faker = require('faker');
const db = require('./db')
Sequelize = db.Sequelize
sequelize = db.sequelize
const batch = sequelize.define('batch', {

batch_id: {type: Sequelize.STRING,allowNull: false},
customer_id: {type: Sequelize.STRING,allowNull: false},
total: {type: Sequelize.STRING,allowNull: false},
status: {type: Sequelize.STRING,allowNull: false},
date_pending: {type: Sequelize.STRING,allowNull: false},
date_sent: {type: Sequelize.STRING,allowNull: false},
date_complete: {type: Sequelize.STRING,allowNull: false},
week_no: {type: Sequelize.STRING,allowNull: false},
not_received: {type: Sequelize.STRING,allowNull: false},
not_received_date: {type: Sequelize.STRING,allowNull: false},
account_number: {type: Sequelize.STRING,allowNull: false},
sort_code: {type: Sequelize.STRING,allowNull: false},
bank_name: {type: Sequelize.STRING,allowNull: false},
account_holder: {type: Sequelize.STRING,allowNull: false},
},
{timestamps: false});

batch.sync({ force: true }).then(() => {
             for (let i = 0; i <= DATA_SIZE; i++) {let batch_id= faker
let customer_id= faker
let total= faker
let status= faker
let date_pending= faker
let date_sent= faker
let date_complete= faker
let week_no= faker
let not_received= faker
let not_received_date= faker
let account_number= faker
let sort_code= faker
let bank_name= faker
let account_holder= faker
customer1.create({
batch_id,
customer_id,
total,
status,
date_pending,
date_sent,
date_complete,
week_no,
not_received,
not_received_date,
account_number,
sort_code,
bank_name,
account_holder,
})}})