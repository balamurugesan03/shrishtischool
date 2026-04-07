const generateStudentId = async (Student) => {
  const count = await Student.countDocuments();
  return `STU${String(count + 1).padStart(5, '0')}`;
};

const generateStaffId = async (Staff) => {
  const count = await Staff.countDocuments();
  return `STF${String(count + 1).padStart(5, '0')}`;
};

const generateProductCode = async (Product) => {
  const count = await Product.countDocuments();
  return `PRD${String(count + 1).padStart(5, '0')}`;
};

const generateInvoiceNumber = async (Invoice) => {
  const count = await Invoice.countDocuments();
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `INV${year}${month}${String(count + 1).padStart(5, '0')}`;
};

const generatePaymentNumber = async (Payment) => {
  const count = await Payment.countDocuments();
  return `PAY${String(count + 1).padStart(5, '0')}`;
};

const generateReceiptNumber = async (Payment) => {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `RCT${yy}${mm}`;
  // Count receipts this month
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
  const monthCount = await Payment.countDocuments({
    type: 'Receipt',
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });
  return `${prefix}${String(monthCount + 1).padStart(4, '0')}`;
};

const generatePurchaseNumber = async (PurchaseEntry) => {
  const count = await PurchaseEntry.countDocuments();
  return `PUR${String(count + 1).padStart(5, '0')}`;
};

module.exports = {
  generateStudentId,
  generateStaffId,
  generateProductCode,
  generateInvoiceNumber,
  generatePaymentNumber,
  generateReceiptNumber,
  generatePurchaseNumber
};
