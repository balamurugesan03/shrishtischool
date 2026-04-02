const express = require('express');
const router = express.Router();
const { getDayBook, createDayBookEntry } = require('../controllers/accountingController');

router.get('/', getDayBook);
router.post('/', createDayBookEntry);

module.exports = router;
