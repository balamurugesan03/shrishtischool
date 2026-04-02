const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number },
  paymentDate: { type: Date },
  paymentMode: { type: String, enum: ['Cash', 'Cheque', 'Online', 'Card'] },
  receiptNumber: { type: String },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid', 'Overdue'], default: 'Pending' },
  academicYear: { type: String },
  term: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
