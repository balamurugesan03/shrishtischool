const express = require('express');
const router = express.Router();
const { getPayments } = require('../controllers/accountingController');
const Payment = require('../models/Payment');
const { generateReceiptNumber } = require('../utils/generateId');
const { successResponse } = require('../utils/apiResponse');

router.get('/', getPayments);

// GET /api/payments/next-receipt-number
router.get('/next-receipt-number', async (req, res, next) => {
  try {
    const receiptNumber = await generateReceiptNumber(Payment);
    return successResponse(res, { receiptNumber });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
