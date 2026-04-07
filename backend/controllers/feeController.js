const Fee = require('../models/Fee');
const Payment = require('../models/Payment');
const CashBook = require('../models/CashBook');
const DayBook = require('../models/DayBook');
const { generatePaymentNumber, generateReceiptNumber } = require('../utils/generateId');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { generateFeePDF } = require('../utils/generateFeePDF');
const wa = require('../services/whatsappService');

exports.getFees = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, student, status, feeType, class: cls, section } = req.query;
    const query = {};
    if (student) query.student = student;
    if (status) query.status = status;
    if (feeType) query.feeType = feeType;

    // class/section filter: find matching students first
    if (cls || section) {
      const Student = require('../models/Student');
      const studentQuery = {};
      if (cls) studentQuery.class = cls;
      if (section) studentQuery.section = section;
      const students = await Student.find(studentQuery, '_id');
      query.student = { $in: students.map(s => s._id) };
    }

    const total = await Fee.countDocuments(query);
    const fees = await Fee.find(query)
      .populate('student', 'firstName lastName studentId class section phone')
      .sort({ dueDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Aggregate summary for current filter
    const summary = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          totalBalance: { $sum: '$balance' },
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      data: fees,
      summary: summary[0] || { totalAmount: 0, totalPaid: 0, totalBalance: 0, count: 0 },
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

exports.getFee = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('student', 'firstName lastName studentId class section');
    if (!fee) return errorResponse(res, 'Fee not found', 404);
    return successResponse(res, fee);
  } catch (error) {
    next(error);
  }
};

exports.createFee = async (req, res, next) => {
  try {
    const fee = await Fee.create({ ...req.body, balance: req.body.amount });
    const populated = await Fee.findById(fee._id).populate('student', 'firstName lastName studentId');
    return successResponse(res, populated, 'Fee created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateFee = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('student', 'firstName lastName studentId');
    if (!fee) return errorResponse(res, 'Fee not found', 404);
    return successResponse(res, fee, 'Fee updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteFee = async (req, res, next) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return errorResponse(res, 'Fee not found', 404);
    return successResponse(res, null, 'Fee deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.collectFeePayment = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return errorResponse(res, 'Fee not found', 404);

    const { amount, paymentMode, receiptNumber } = req.body;
    if (amount > fee.balance) {
      return errorResponse(res, `Payment exceeds balance of ${fee.balance}`, 400);
    }

    const newPaidAmount = fee.paidAmount + amount;
    const newBalance = fee.amount - newPaidAmount;
    const status = newBalance <= 0 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Pending';

    await Fee.findByIdAndUpdate(req.params.id, {
      paidAmount: newPaidAmount,
      balance: newBalance,
      status,
      paymentDate: new Date(),
      paymentMode,
      receiptNumber
    });

    const paymentNumber = await generatePaymentNumber(Payment);
    const autoReceiptNumber = await generateReceiptNumber(Payment);
    const finalReceiptNumber = receiptNumber || autoReceiptNumber;

    await Fee.findByIdAndUpdate(req.params.id, { receiptNumber: finalReceiptNumber });

    const payment = await Payment.create({
      paymentNumber,
      receiptNumber: finalReceiptNumber,
      type: 'Receipt',
      referenceType: 'Fee',
      referenceId: fee._id,
      student: fee.student,
      amount,
      paymentMode,
      description: `Fee payment: ${fee.feeType}`
    });

    await CashBook.create({
      date: new Date(),
      description: `Fee collection: ${fee.feeType}`,
      type: 'Receipt',
      amount,
      referenceType: 'Fee',
      referenceId: fee._id
    });

    await DayBook.create({
      date: new Date(),
      description: `Fee collection: ${fee.feeType}`,
      type: 'Income',
      amount,
      category: 'Fee',
      paymentMode,
      referenceType: 'Fee',
      referenceId: fee._id
    });

    return successResponse(res, { payment, feeStatus: status }, 'Fee payment recorded successfully');
  } catch (error) {
    next(error);
  }
};

exports.sendFeeWhatsApp = async (req, res, next) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'firstName lastName studentId class section phone');

    if (!fee) return errorResponse(res, 'Fee not found', 404);

    const phone = fee.student?.phone;
    if (!phone) return errorResponse(res, 'Student phone number not available', 400);

    const pdfBuffer = await generateFeePDF(fee);
    const filename = `Fee_${fee.student.studentId}_${fee.feeType.replace(/\s+/g, '_')}.pdf`;
    await wa.sendDocument(phone, pdfBuffer, filename);

    return successResponse(res, {}, `Fee receipt PDF sent to ${phone} via WhatsApp`);
  } catch (error) {
    next(error);
  }
};
