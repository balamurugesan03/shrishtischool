const mongoose = require('mongoose');

const dayBookSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['Income', 'Expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online', 'Card', 'UPI'], default: 'Cash' },
  referenceType: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  voucherNumber: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('DayBook', dayBookSchema);
