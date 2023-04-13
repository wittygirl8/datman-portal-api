const Customer = require("../../database/model/customers");

module.exports.checkIfClient = async (params) => {
  let phone = `${params.phone}`;

  if (!phone) {
    return Promise.reject({ message: "phone number missing" });
  }
  return Customer.findAll({
    where: {
      customers_mobile: phone,
      progress_status: 2,
    },
  });
};
