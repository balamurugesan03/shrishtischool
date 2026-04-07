const qrcode = require('qrcode');
const Staff = require('../models/Staff');
const StaffAttendance = require('../models/StaffAttendance');
const wa = require('../services/whatsappService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');

// GET /api/staff-attendance/qr  — all active staff QR codes (filtered by department)
exports.getAllStaffQRs = async (req, res, next) => {
  try {
    const { department } = req.query;
    const query = { status: 'Active' };
    if (department) query.department = department;

    const staffList = await Staff.find(query).sort({ department: 1, firstName: 1 });

    const result = await Promise.all(staffList.map(async (s) => {
      const qr = await qrcode.toDataURL(`STAFF:${s._id.toString()}`, { width: 200, margin: 2 });
      return {
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        staffId: s.staffId,
        department: s.department,
        designation: s.designation,
        role: s.role,
        phone: s.phone,
        qr
      };
    }));

    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

// POST /api/staff-attendance/scan  — process QR scan (no auth, kiosk use)
exports.scanStaffAttendance = async (req, res, next) => {
  try {
    const { staffId } = req.body; // MongoDB _id from QR (prefixed STAFF:)
    if (!staffId) return errorResponse(res, 'staffId is required', 400);

    // Strip "STAFF:" prefix if present
    const cleanId = staffId.replace(/^STAFF:/, '');

    const staff = await Staff.findById(cleanId);
    if (!staff) return errorResponse(res, 'Staff member not found', 404);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const todayRecords = await StaffAttendance.find({ staff: staff._id, date: today }).sort({ timestamp: 1 });

    const hasIN  = todayRecords.some(r => r.type === 'IN');
    const hasOUT = todayRecords.some(r => r.type === 'OUT');

    // Auto-detect: no IN → mark IN; has IN but no OUT → mark OUT; both done → new IN cycle
    const type = !hasIN ? 'IN' : (hasIN && !hasOUT ? 'OUT' : 'IN');

    const now = new Date();

    const record = await StaffAttendance.create({
      staff: staff._id,
      date: today,
      type,
      timestamp: now
    });

    // Format for WhatsApp message
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    const fullName = `${staff.firstName} ${staff.lastName}`;

    let message;
    const schoolName = 'Shrishti Kinder International School';

    // Punctuality check — cutoff 08:30
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const cutoff = 8 * 60 + 30; // 08:30 AM
    const isLate = totalMinutes > cutoff;

    const statusLine = isLate
      ? `🔴 *Status: LATE* ⚠️`
      : `🟢 *Status: ON TIME* ✅`;

    if (type === 'IN') {
      message = `✅ *Staff Attendance Alert*\n🏫 *${schoolName}*\n\n*${fullName}* has *checked in* to school.\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n${statusLine}\n🏢 Department: ${staff.department}\n💼 Role: ${staff.role}\n🆔 ID: ${staff.staffId}`;
    } else {
      message = `🔔 *Staff Departure Alert*\n🏫 *${schoolName}*\n\n*${fullName}* has *checked out* from school.\n📅 Date: ${dateStr}\n⏰ Time: ${timeStr}\n🏢 Department: ${staff.department}\n💼 Role: ${staff.role}\n🆔 ID: ${staff.staffId}`;
    }

    let whatsappSent = false;
    let whatsappError = null;

    const ADMIN_PHONE = '7558163618';

    try {
      const sends = [];
      if (staff.phone) sends.push(wa.sendMessage(staff.phone, message));
      sends.push(wa.sendMessage(ADMIN_PHONE, message));
      await Promise.all(sends);
      whatsappSent = true;
    } catch (err) {
      whatsappError = err.message;
    }

    record.whatsappSent = whatsappSent;
    record.whatsappError = whatsappError;
    await record.save();

    return successResponse(res, {
      type,
      staff: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        staffId: staff.staffId,
        department: staff.department,
        role: staff.role
      },
      timestamp: now,
      whatsappSent,
      whatsappError
    }, `Staff attendance marked: ${type}`);
  } catch (err) {
    next(err);
  }
};

// GET /api/staff-attendance  — list with filters
exports.getStaffAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, date, staff, type } = req.query;
    const query = {};
    if (date) query.date = date;
    if (staff) query.staff = staff;
    if (type) query.type = type;

    const total = await StaffAttendance.countDocuments(query);
    const records = await StaffAttendance.find(query)
      .populate('staff', 'firstName lastName staffId department role')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return paginatedResponse(res, records, total, page, limit);
  } catch (err) {
    next(err);
  }
};

// GET /api/staff-attendance/summary  — today's stats
exports.getStaffTodaySummary = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const inCount  = await StaffAttendance.countDocuments({ date: today, type: 'IN' });
    const outCount = await StaffAttendance.countDocuments({ date: today, type: 'OUT' });
    return successResponse(res, { date: today, inCount, outCount });
  } catch (err) {
    next(err);
  }
};
