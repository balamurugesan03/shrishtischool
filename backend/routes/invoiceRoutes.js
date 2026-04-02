const express = require('express');
const router = express.Router();
const { getInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice, recordPayment, sendInvoiceWhatsApp } = require('../controllers/invoiceController');

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);
router.post('/:id/payment', recordPayment);
router.post('/:id/send-whatsapp', sendInvoiceWhatsApp);

module.exports = router;
