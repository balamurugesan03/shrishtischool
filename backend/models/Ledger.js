const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now, required: true },
  type: { type: String, enum: ['Debit', 'Credit'], required: true },
  accountHead: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  balance: { type: Number },
  referenceType: { type: String },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online', 'Card', 'UPI'] },
  voucherNumber: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Ledger', ledgerSchema);
