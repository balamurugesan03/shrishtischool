const express = require('express');
const router = express.Router();
const { getFees, getFee, createFee, updateFee, deleteFee, collectFeePayment, sendFeeWhatsApp } = require('../controllers/feeController');

router.get('/', getFees);
router.get('/:id', getFee);
router.post('/', createFee);
router.put('/:id', updateFee);
router.delete('/:id', deleteFee);
router.post('/:id/collect', collectFeePayment);
router.post('/:id/send-whatsapp', sendFeeWhatsApp);

module.exports = router;
