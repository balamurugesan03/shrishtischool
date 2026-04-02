const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  staffId: { type: String, unique: true, required: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  department: { type: String, required: true },
  role: { type: String, required: true },
  designation: { type: String },
  joiningDate: { type: Date, default: Date.now },
  salary: { type: Number, required: true },
  qualification: { type: String },
  experience: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    default: 'Active'
  },
  photo: { type: String },
  bankDetails: {
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountHolderName: String
  }
}, { timestamps: true });

staffSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

staffSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Staff', staffSchema);
