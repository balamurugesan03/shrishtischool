const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  getAllStaffQRs,
  scanStaffAttendance,
  getStaffAttendance,
  getStaffTodaySummary
} = require('../controllers/staffAttendanceController');

router.get('/qr',       protect, getAllStaffQRs);
router.post('/scan',    scanStaffAttendance); // open — kiosk/scanner use
router.get('/summary',  protect, getStaffTodaySummary);
router.get('/',         protect, getStaffAttendance);

module.exports = router;
