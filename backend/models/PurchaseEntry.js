const mongoose = require('mongoose');

const purchaseEntrySchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true, required: true },
  date: { type: Date, default: Date.now },
  supplier: { type: String, trim: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    costPrice: { type: Number, required: true, min: 0 },
    totalCost: { type: Number }
  }],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseEntry', purchaseEntrySchema);
