const mongoose = require('mongoose');

const cashBookSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Receipt', 'Payment'], required: true },
  amount: { type: Number, required: true },
  balance: { type: Number },
  referenceType: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  voucherNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CashBook', cashBookSchema);
