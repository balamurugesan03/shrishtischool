const express = require('express');
const router = express.Router();
const { getCashBook, createCashBookEntry } = require('../controllers/accountingController');

router.get('/', getCashBook);
router.post('/', createCashBookEntry);

module.exports = router;
