const mongoose = require('mongoose');

const studentInventorySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  pricePerUnit: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  issueDate: { type: Date, default: Date.now },
  returnDate: { type: Date },
  status: { type: String, enum: ['Issued', 'Returned', 'Lost'], default: 'Issued' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  notes: { type: String },
  issuedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StudentInventory', studentInventorySchema);
