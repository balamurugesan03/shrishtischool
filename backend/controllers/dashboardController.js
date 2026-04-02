const Student = require('../models/Student');
const Product = require('../models/Product');
const Invoice = require('../models/Invoice');
const Staff = require('../models/Staff');
const Fee = require('../models/Fee');
const DayBook = require('../models/DayBook');
const { successResponse } = require('../utils/apiResponse');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      activeStudents,
      totalStaff,
      activeStaff,
      totalProducts,
      lowStockProducts,
      totalInventoryValue,
      monthlyIncome,
      monthlyExpense,
      todayIncome,
      pendingInvoices,
      recentInvoices,
      lowStockItems,
      feeCollection
    ] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ status: 'Active' }),
      Staff.countDocuments(),
      Staff.countDocuments({ status: 'Active' }),
      Product.countDocuments({ status: 'Active' }),
      Product.countDocuments({ $expr: { $lte: ['$currentStock', '$minimumStock'] }, status: 'Active' }),
      Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$price', '$currentStock'] } } } }]),
      DayBook.aggregate([
        { $match: { date: { $gte: startOfMonth }, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      DayBook.aggregate([
        { $match: { date: { $gte: startOfMonth }, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      DayBook.aggregate([
        { $match: { date: { $gte: startOfDay }, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Invoice.countDocuments({ paymentStatus: { $in: ['Pending', 'Partial'] } }),
      Invoice.find()
        .populate('student', 'firstName lastName studentId')
        .sort({ createdAt: -1 })
        .limit(5),
      Product.find({ $expr: { $lte: ['$currentStock', '$minimumStock'] }, status: 'Active' })
        .populate('category', 'name')
        .limit(5),
      Fee.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' }, paid: { $sum: '$paidAmount' } } }
      ])
    ]);

    return successResponse(res, {
      students: { total: totalStudents, active: activeStudents },
      staff: { total: totalStaff, active: activeStaff },
      inventory: {
        totalProducts,
        lowStockCount: lowStockProducts,
        totalValue: totalInventoryValue[0]?.total || 0,
        lowStockItems
      },
      finance: {
        monthlyIncome: monthlyIncome[0]?.total || 0,
        monthlyExpense: monthlyExpense[0]?.total || 0,
        todayCollection: todayIncome[0]?.total || 0,
        pendingInvoices
      },
      recentInvoices,
      feeCollection
    });
  } catch (error) {
    next(error);
  }
};
