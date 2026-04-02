const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    required: true
  },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  class: { type: String, required: true },
  section: { type: String, required: true },
  rollNumber: { type: String },
  admissionDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Transferred', 'Graduated'],
    default: 'Active'
  },
  photo: { type: String },
  parentDetails: {
    fatherName: String,
    fatherPhone: String,
    fatherOccupation: String,
    motherName: String,
    motherPhone: String,
    motherOccupation: String,
    guardianName: String,
    guardianPhone: String,
    relationship: String
  },
  bloodGroup: { type: String },
  religion: { type: String },
  category: { type: String },
  previousSchool: { type: String },
  academicYear: { type: String }
}, { timestamps: true });

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
