const StudentInventory = require('../models/StudentInventory');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Ledger = require('../models/Ledger');
const CashBook = require('../models/CashBook');
const DayBook = require('../models/DayBook');
const { generateInvoiceNumber } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.issueInventory = async (req, res, next) => {
  try {
    const { student, items, issuedBy, notes, payment = {} } = req.body;

    if (!items || items.length === 0) {
      return errorResponse(res, 'No items provided', 400);
    }

    const cashAmount  = Number(payment.cashAmount  || 0);
    const gpayAmount  = Number(payment.gpayAmount  || 0);
    const totalPaid   = Number(payment.totalPaid   || 0) || (cashAmount + gpayAmount);
    const paymentMode    = payment.paymentMode    || 'Pending';
    const paymentStatus  = payment.paymentStatus  || 'Pending';

    // Check stock availability and prepare items
    const invoiceItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return errorResponse(res, `Product not found: ${item.product}`, 404);
      if (product.currentStock < item.quantity) {
        return errorResponse(res, `Insufficient stock for ${product.name}. Available: ${product.currentStock}`, 400);
      }

      const totalPrice = product.price * item.quantity;
      subtotal += totalPrice;

      invoiceItems.push({
        product: product._id,
        description: product.name,
        quantity: item.quantity,
        pricePerUnit: product.price,
        totalPrice
      });
    }

    const invoiceBalance = Math.max(0, subtotal - totalPaid);

    // Generate invoice
    const invoiceNumber = await generateInvoiceNumber(Invoice);
    const invoice = await Invoice.create({
      invoiceNumber,
      student,
      items: invoiceItems,
      subtotal,
      totalAmount: subtotal,
      paidAmount: totalPaid,
      balance: invoiceBalance,
      paymentStatus,
      invoiceType: 'Inventory'
    });

    // Create student inventory records & reduce stock
    const inventoryRecords = [];
    for (const item of invoiceItems) {
      const record = await StudentInventory.create({
        student,
        product: item.product,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit,
        totalPrice: item.totalPrice,
        invoice: invoice._id,
        issuedBy,
        notes
      });
      inventoryRecords.push(record);

      // Reduce stock
      await Product.findByIdAndUpdate(item.product, {
        $inc: { currentStock: -item.quantity }
      });
    }

    // Ledger entry
    await Ledger.create({
      date: new Date(),
      type: 'Credit',
      accountHead: 'Inventory Sales',
      description: `Inventory issued - Invoice ${invoiceNumber}`,
      amount: subtotal,
      referenceType: 'Invoice',
      referenceId: invoice._id
    });

    // CashBook & DayBook entries only for amount actually paid
    if (totalPaid > 0) {
      await CashBook.create({
        date: new Date(),
        description: `Payment received - Invoice ${invoiceNumber} (${paymentMode})`,
        type: 'Receipt',
        amount: totalPaid,
        referenceType: 'Invoice',
        referenceId: invoice._id
      });

      await DayBook.create({
        date: new Date(),
        description: `Inventory issued to student - Invoice ${invoiceNumber}`,
        type: 'Income',
        amount: totalPaid,
        category: 'Inventory',
        paymentMode,
        referenceType: 'Invoice',
        referenceId: invoice._id
      });
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('student', 'firstName lastName studentId')
      .populate('items.product', 'name productCode');

    return successResponse(res, { invoice: populatedInvoice, inventoryRecords }, 'Inventory issued and invoice generated', 201);
  } catch (error) {
    next(error);
  }
};

exports.getStudentInventory = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const inventory = await StudentInventory.find({ student: studentId })
      .populate('product', 'name productCode price unit')
      .populate('invoice', 'invoiceNumber')
      .sort({ issueDate: -1 });
    return successResponse(res, inventory);
  } catch (error) {
    next(error);
  }
};

exports.getAllIssuedInventory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, paymentStatus } = req.query;
    const query = { invoiceType: 'Inventory' };
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('student', 'firstName lastName studentId class section')
      .populate('items.product', 'name productCode price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, invoices, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.returnInventory = async (req, res, next) => {
  try {
    const { returnDate, notes } = req.body;
    const record = await StudentInventory.findByIdAndUpdate(
      req.params.id,
      { status: 'Returned', returnDate: returnDate || new Date(), notes },
      { new: true }
    ).populate('product');

    if (!record) return errorResponse(res, 'Inventory record not found', 404);

    // Return to stock
    await Product.findByIdAndUpdate(record.product._id, {
      $inc: { currentStock: record.quantity }
    });

    return successResponse(res, record, 'Inventory returned successfully');
  } catch (error) {
    next(error);
  }
};
