const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productCode: { type: String, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, min: 0 },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 5 },
  unit: { type: String, default: 'Piece' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

productSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
