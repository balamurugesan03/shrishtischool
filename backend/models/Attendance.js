const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  timestamp: { type: Date, default: Date.now },
  whatsappSent: { type: Boolean, default: false },
  whatsappError: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
