module.exports = (resource, logicalId) => {
  if (logicalId.startsWith("Auth")) return { destination: "AuthStack" };
  if (logicalId.startsWith("Payment")) return { destination: "PaymentStack" };
  if (logicalId.startsWith("Withdrawal")) return { destination: "WithdrawalStack" };
  if (logicalId.startsWith("Customer")) return { destination: "CustomerStack" };
  if (logicalId.startsWith("It")) return { destination: "ItStack" };
  if (logicalId.startsWith("Miss")) return { destination: "MissStack" };
  if (logicalId.startsWith("Onboard")) return { destination: "OnboardStack" };
  if (logicalId.startsWith("SpecialRent")) return { destination: "SpecialRentStack" };
  if (logicalId.startsWith("Contract")) return { destination: "ContractStack" };
  if (logicalId.startsWith("ChargeBack")) return { destination: "ChargeBackStack" };
  if (logicalId.startsWith("Credit")) return { destination: "CreditStack" };
  if (logicalId.startsWith("Bank")) return { destination: "BankStack" };
  if (logicalId.startsWith("Invoice")) return { destination: "InvoiceStack" };
  if (logicalId.startsWith("Reports")) return { destination: "ReportsStack" };
  return false;
};
