const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, unique: true, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['Receipt', 'Payment'], required: true },
  referenceType: { type: String, enum: ['Invoice', 'Fee', 'Staff', 'Vendor', 'Other'] },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  amount: { type: Number, required: true },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online', 'Card', 'UPI'], default: 'Cash' },
  description: { type: String },
  chequeNumber: { type: String },
  bankName: { type: String },
  transactionId: { type: String },
  status: { type: String, enum: ['Completed', 'Pending', 'Failed'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
