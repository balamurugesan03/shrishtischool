const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getStudentQR,
  getAllStudentQRs,
  scanAttendance,
  getAttendance,
  getTodaySummary
} = require('../controllers/attendanceController');

router.get('/qr',        protect, getAllStudentQRs);
router.get('/qr/:id',    protect, getStudentQR);
router.post('/scan',     scanAttendance); // open — kiosk/scanner use
router.get('/summary',   protect, getTodaySummary);
router.get('/',          protect, getAttendance);

module.exports = router;
