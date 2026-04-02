const Product = require('../models/Product');
const PurchaseEntry = require('../models/PurchaseEntry');
const Ledger = require('../models/Ledger');
const CashBook = require('../models/CashBook');
const DayBook = require('../models/DayBook');
const { generateProductCode, generatePurchaseNumber } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', category, status, lowStock } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (lowStock === 'true') query.$expr = { $lte: ['$currentStock', '$minimumStock'] };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, products, total, page, limit);
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return errorResponse(res, 'Product not found', 404);
    return successResponse(res, product);
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const productCode = await generateProductCode(Product);
    const product = await Product.create({ ...req.body, productCode });
    return successResponse(res, product, 'Product created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name');
    if (!product) return errorResponse(res, 'Product not found', 404);
    return successResponse(res, product, 'Product updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return errorResponse(res, 'Product not found', 404);
    return successResponse(res, null, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
      status: 'Active'
    }).populate('category', 'name');
    return successResponse(res, products);
  } catch (error) {
    next(error);
  }
};

exports.createPurchaseEntry = async (req, res, next) => {
  try {
    const purchaseNumber = await generatePurchaseNumber(PurchaseEntry);
    const { items, totalAmount, paidAmount, supplier, date, notes } = req.body;

    // Update stock for each item
    for (const item of items) {
      item.totalCost = item.quantity * item.costPrice;
      await Product.findByIdAndUpdate(item.product, {
        $inc: { currentStock: item.quantity },
        $set: { costPrice: item.costPrice }
      });
    }

    const balance = totalAmount - (paidAmount || 0);
    const paymentStatus = paidAmount >= totalAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

    const purchase = await PurchaseEntry.create({
      purchaseNumber,
      items,
      totalAmount,
      paidAmount: paidAmount || 0,
      balance,
      paymentStatus,
      supplier,
      date,
      notes
    });

    // Ledger entry
    await Ledger.create({
      date: date || new Date(),
      type: 'Debit',
      accountHead: 'Purchase',
      description: `Purchase Entry ${purchaseNumber}`,
      amount: totalAmount,
      referenceType: 'PurchaseEntry',
      referenceId: purchase._id
    });

    if (paidAmount > 0) {
      await CashBook.create({
        date: date || new Date(),
        description: `Payment for Purchase ${purchaseNumber}`,
        type: 'Payment',
        amount: paidAmount,
        referenceType: 'PurchaseEntry',
        referenceId: purchase._id
      });
      await DayBook.create({
        date: date || new Date(),
        description: `Purchase Entry ${purchaseNumber}`,
        type: 'Expense',
        amount: paidAmount,
        category: 'Purchase',
        paymentMode: 'Cash',
        referenceType: 'PurchaseEntry',
        referenceId: purchase._id
      });
    }

    return successResponse(res, purchase, 'Purchase entry created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.getPurchaseEntries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const total = await PurchaseEntry.countDocuments();
    const entries = await PurchaseEntry.find()
      .populate('items.product', 'name productCode')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    return paginatedResponse(res, entries, total, page, limit);
  } catch (error) {
    next(error);
  }
};
