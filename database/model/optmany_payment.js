const { sequelizeInstance, Sequelize } = require('../')
console.log('creating the optomany_payment')

const optomanyPayment = sequelizeInstance.define('optomany_payment', {

    id: {
        type: Sequelize.INTEGER(11),
        autoIncrement: true,
        allowNull: null,
        primaryKey: true
    },
    card_payment_id: {
        type: Sequelize.STRING, defaultValue: null
    },
    AuthCode: { type: Sequelize.STRING, defaultValue: null },
    AuthorizationType: { type: Sequelize.STRING, defaultValue: null },
    AvsHouseNumberResult: { type: Sequelize.STRING, defaultValue: null },
    AvsPostcodeResult: { type: Sequelize.STRING, defaultValue: null },
    CscResult: { type: Sequelize.STRING, defaultValue: null },
    EftPaymentId: { type: Sequelize.STRING, defaultValue: null },
    PayerAuth: { type: Sequelize.STRING, defaultValue: null },
    ResponseCode: { type: Sequelize.STRING, defaultValue: null },
    Reference: { type: Sequelize.STRING, defaultValue: null },
    CurrencyId: { type: Sequelize.STRING, defaultValue: null },
    CountryId: { type: Sequelize.STRING, defaultValue: null },
    MerchantDepartmentId: { type: Sequelize.STRING, defaultValue: null },
    MerchantTokenId: { type: Sequelize.STRING, defaultValue: null },
    AcquirerReferenceData: { type: Sequelize.STRING, defaultValue: null },
    SchemeReferenceData: { type: Sequelize.STRING, defaultValue: null },
},
    { timestamps: false });

module.exports = optomanyPayment;