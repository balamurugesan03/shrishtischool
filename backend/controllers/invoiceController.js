const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Ledger = require('../models/Ledger');
const CashBook = require('../models/CashBook');
const DayBook = require('../models/DayBook');
const { generateInvoiceNumber, generatePaymentNumber, generateReceiptNumber } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { generateInvoicePDF } = require('../utils/generateInvoicePDF');
const wa = require('../services/whatsappService');

exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', paymentStatus, invoiceType, student } = req.query;
    const query = {};

    if (search) {
      query.$or = [{ invoiceNumber: { $regex: search, $options: 'i' } }];
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (invoiceType) query.invoiceType = invoiceType;
    if (student) query.student = student;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('student', 'firstName lastName studentId class section')
      .populate('items.product', 'name productCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, invoices, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('student', 'firstName lastName studentId class section email phone address parentDetails')
      .populate('items.product', 'name productCode unit');
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, invoice);
  } catch (error) {
    next(error);
  }
};

exports.createInvoice = async (req, res, next) => {
  try {
    const invoiceNumber = await generateInvoiceNumber(Invoice);
    const { items, discount = 0, tax = 0 } = req.body;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.pricePerUnit), 0);
    const totalAmount = subtotal - discount + (subtotal * tax / 100);

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      subtotal,
      totalAmount,
      balance: totalAmount,
      items: items.map(item => ({
        ...item,
        totalPrice: item.quantity * item.pricePerUnit
      }))
    });

    await Ledger.create({
      date: new Date(),
      type: 'Credit',
      accountHead: 'Income',
      description: `Invoice ${invoiceNumber}`,
      amount: totalAmount,
      referenceType: 'Invoice',
      referenceId: invoice._id
    });

    const populated = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName studentId')
      .populate('items.product', 'name productCode');

    return successResponse(res, populated, 'Invoice created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('student', 'firstName lastName studentId')
      .populate('items.product', 'name productCode');
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, invoice, 'Invoice updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);
    return successResponse(res, null, 'Invoice deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.recordPayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return errorResponse(res, 'Invoice not found', 404);

    const { amount, paymentMode, notes } = req.body;
    if (amount > invoice.balance) {
      return errorResponse(res, `Payment amount exceeds balance of ${invoice.balance}`, 400);
    }

    const newPaidAmount = invoice.paidAmount + amount;
    const newBalance = invoice.totalAmount - newPaidAmount;
    const paymentStatus = newBalance <= 0 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Pending';

    await Invoice.findByIdAndUpdate(req.params.id, {
      paidAmount: newPaidAmount,
      balance: newBalance,
      paymentStatus
    });

    const paymentNumber = await generatePaymentNumber(Payment);
    const receiptNumber = await generateReceiptNumber(Payment);
    const payment = await Payment.create({
      paymentNumber,
      receiptNumber,
      type: 'Receipt',
      referenceType: 'Invoice',
      referenceId: invoice._id,
      student: invoice.student,
      amount,
      paymentMode,
      description: notes || `Payment for Invoice ${invoice.invoiceNumber}`
    });

    await CashBook.create({
      date: new Date(),
      description: `Receipt for Invoice ${invoice.invoiceNumber}`,
      type: 'Receipt',
      amount,
      referenceType: 'Invoice',
      referenceId: invoice._id
    });

    await DayBook.create({
      date: new Date(),
      description: `Receipt for Invoice ${invoice.invoiceNumber}`,
      type: 'Income',
      amount,
      category: 'Fee Collection',
      paymentMode,
      referenceType: 'Invoice',
      referenceId: invoice._id
    });

    return successResponse(res, { payment, invoiceStatus: paymentStatus }, 'Payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

exports.sendInvoiceWhatsApp = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('student')
      .populate('items.product');

    if (!invoice) return errorResponse(res, 'Invoice not found', 404);

    const phone = invoice.student?.phone;
    if (!phone) return errorResponse(res, 'Student phone number not available', 400);

    const pdfBuffer = await generateInvoicePDF(invoice);
    const filename = `Invoice_${invoice.invoiceNumber}.pdf`;
    await wa.sendDocument(phone, pdfBuffer, filename);

    return successResponse(res, {}, `Invoice PDF sent to ${phone} via WhatsApp`);
  } catch (error) {
    next(error);
  }
};
