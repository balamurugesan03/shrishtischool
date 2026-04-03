const qrcode = require('qrcode');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const wa = require('../services/whatsappService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// GET /api/attendance/qr/:id  — single student QR
exports.getStudentQR = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const qrDataURL = await qrcode.toDataURL(student._id.toString(), { width: 256, margin: 2 });
    return successResponse(res, {
      qr: qrDataURL,
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        section: student.section
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/qr  — all students QR list (filtered by class/section)
exports.getAllStudentQRs = async (req, res, next) => {
  try {
    const { class: cls, section } = req.query;
    const query = { status: 'Active' };
    if (cls) query.class = cls;
    if (section) query.section = section;

    const students = await Student.find(query).sort({ class: 1, section: 1, firstName: 1 });

    const result = await Promise.all(students.map(async (s) => {
      const qr = await qrcode.toDataURL(s._id.toString(), { width: 200, margin: 2 });
      return {
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentId: s.studentId,
        class: s.class,
        section: s.section,
        qr
      };
    }));

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/scan  — process QR scan (no auth, kiosk use)
exports.scanAttendance = async (req, res, next) => {
  try {
    const { studentId } = req.body; // MongoDB _id from QR
    if (!studentId) return errorResponse(res, 'studentId is required', 400);

    const student = await Student.findById(studentId);
    if (!student) return errorResponse(res, 'Student not found', 404);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const todayRecords = await Attendance.find({ student: student._id, date: today }).sort({ timestamp: 1 });

    const hasIN  = todayRecords.some(r => r.type === 'IN');
    const hasOUT = todayRecords.some(r => r.type === 'OUT');

    // Auto-detect: no IN → mark IN; has IN but no OUT → mark OUT; both done → new IN cycle
    const type = !hasIN ? 'IN' : (hasIN && !hasOUT ? 'OUT' : 'IN');

    const now = new Date();

    const record = await Attendance.create({
      student: student._id,
      date: today,
      type,
      timestamp: now
    });

    // Format for WhatsApp message
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const fullName = `${student.firstName} ${student.lastName}`;

    let message;
    if (type === 'IN') {
      message = `✅ *Attendance Alert*\n\n*${fullName}* has *entered* school.\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n🏫 Class: ${student.class} - ${student.section}\n🆔 ID: ${student.studentId}`;
    } else {
      message = `🔔 *Departure Alert*\n\n*${fullName}* has *left* school.\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n🏫 Class: ${student.class} - ${student.section}\n🆔 ID: ${student.studentId}`;
    }

    // Collect all available phone numbers (student + all parent fields)
    const phones = [
      student.parentDetails?.fatherPhone,
      student.parentDetails?.motherPhone,
      student.parentDetails?.guardianPhone,
      student.phone
    ].filter(Boolean);

    let whatsappSent = false;
    let whatsappError = null;

    // Deduplicate phone numbers before sending
    const uniquePhones = [...new Set(phones)];

    if (uniquePhones.length > 0) {
      const errors = [];
      for (const phone of uniquePhones) {
        try {
          await wa.sendMessage(phone, message);
          whatsappSent = true;
        } catch (err) {
          errors.push(`${phone}: ${err.message}`);
        }
      }
      if (!whatsappSent && errors.length > 0) {
        whatsappError = errors.join(' | ');
      }
    }

    record.whatsappSent = whatsappSent;
    record.whatsappError = whatsappError;
    await record.save();

    return successResponse(res, {
      type,
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        studentId: student.studentId,
        class: student.class,
        section: student.section
      },
      timestamp: now,
      whatsappSent,
      whatsappError,
      phoneCount: uniquePhones.length
    }, `Attendance marked: ${type}`);
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance  — list with filters
exports.getAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, date, student, type } = req.query;
    const query = {};
    if (date) query.date = date;
    if (student) query.student = student;
    if (type) query.type = type;

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId class section')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, records, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/today-summary  — today's stats
exports.getTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const inCount  = await Attendance.countDocuments({ date: today, type: 'IN' });
    const outCount = await Attendance.countDocuments({ date: today, type: 'OUT' });
    return successResponse(res, { date: today, inCount, outCount });
  } catch (err) {
    next(err);
  }
};
