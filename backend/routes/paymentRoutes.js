const express = require('express');
const router = express.Router();
const { getPayments } = require('../controllers/accountingController');

router.get('/', getPayments);

module.exports = router;
