const express = require('express');
const router = express.Router();
const { getLedger, createLedgerEntry } = require('../controllers/accountingController');

router.get('/', getLedger);
router.post('/', createLedgerEntry);

module.exports = router;
