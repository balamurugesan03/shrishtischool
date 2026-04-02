const Ledger = require('../models/Ledger');
const CashBook = require('../models/CashBook');
const DayBook = require('../models/DayBook');
const Payment = require('../models/Payment');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// LEDGER
exports.getLedger = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, type, accountHead } = req.query;
    const query = {};
    if (type) query.type = type;
    if (accountHead) query.accountHead = { $regex: accountHead, $options: 'i' };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Ledger.countDocuments(query);
    const entries = await Ledger.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totals = await Ledger.aggregate([
      { $match: query },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    return res.json({
      success: true,
      data: entries,
      totals: totals.reduce((acc, t) => ({ ...acc, [t._id]: t.total }), {}),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createLedgerEntry = async (req, res, next) => {
  try {
    const entry = await Ledger.create(req.body);
    return successResponse(res, entry, 'Ledger entry created', 201);
  } catch (error) {
    next(error);
  }
};

// CASHBOOK
exports.getCashBook = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, type } = req.query;
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await CashBook.countDocuments(query);
    const entries = await CashBook.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const summary = await CashBook.aggregate([
      { $match: query },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    return res.json({
      success: true,
      data: entries,
      summary: summary.reduce((acc, s) => ({ ...acc, [s._id]: s.total }), {}),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createCashBookEntry = async (req, res, next) => {
  try {
    const entry = await CashBook.create(req.body);
    return successResponse(res, entry, 'CashBook entry created', 201);
  } catch (error) {
    next(error);
  }
};

// DAYBOOK
exports.getDayBook = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, type, date } = req.query;
    const query = {};
    if (type) query.type = type;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await DayBook.countDocuments(query);
    const entries = await DayBook.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const summary = await DayBook.aggregate([
      { $match: query },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    return res.json({
      success: true,
      data: entries,
      summary: summary.reduce((acc, s) => ({ ...acc, [s._id]: s.total }), {}),
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.createDayBookEntry = async (req, res, next) => {
  try {
    const entry = await DayBook.create(req.body);

    // Sync to cashbook and ledger
    await CashBook.create({
      date: entry.date,
      description: entry.description,
      type: entry.type === 'Income' ? 'Receipt' : 'Payment',
      amount: entry.amount,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId
    });

    await Ledger.create({
      date: entry.date,
      type: entry.type === 'Income' ? 'Credit' : 'Debit',
      accountHead: entry.category || 'General',
      description: entry.description,
      amount: entry.amount,
      paymentMode: entry.paymentMode,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId
    });

    return successResponse(res, entry, 'DayBook entry created', 201);
  } catch (error) {
    next(error);
  }
};

// PAYMENTS
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const query = {};
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('staff', 'firstName lastName staffId')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, payments, total, page, limit);
  } catch (error) {
    next(error);
  }
};
