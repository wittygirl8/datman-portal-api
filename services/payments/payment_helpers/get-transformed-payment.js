const helpers = require("../../../library/helpers");
const changeCase = require("change-case");
const moment = require('moment-timezone');

module.exports.getTransformedPayment0bject = async (payment) => {

    let allTotal = 0;
    let totalNumberOfOrder = 0;
    let fees = 0;
    
    let transformedPayment = payment.map((item) => {
  
        let total = helpers.formatCurrency(item.total);
        let firstname = changeCase.sentenceCase(item.firstname);
        let lastname = changeCase.sentenceCase(item.lastname);
        let address = changeCase.sentenceCase(item.address);
        let time = moment.tz(item.time, process.env.DEFAULT_TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
        // let payed = helpers.formatCurrency(item.dataValues['payed'])
        let payed = 0;
  
        allTotal = parseFloat(allTotal) + parseFloat(total);
        if (parseFloat(item.total) > 0) {
          totalNumberOfOrder = parseInt(totalNumberOfOrder) + 1;
          fees = parseFloat(fees) + parseFloat(item.fees);
          payed = helpers.formatCurrency(
            item.total - item.fees
          );
        }
        //get 3ds uniquereference
        let TxnReference = helpers.getTxnUniqueReference(item);
        //get 3ds status
        let ThreeDsStatus = helpers.getThreeDsStatus(item);
        delete item.VendorTxCode; 
        delete item.CrossReference; 
        return { ...item, total, firstname, lastname, address, payed, time, TxnReference,ThreeDsStatus};
    });
    return {
        transformedPayment, allTotal
    }
  
  }