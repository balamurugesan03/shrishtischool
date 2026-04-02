const express = require('express');
const router  = express.Router();
const wa      = require('../services/whatsappService');

// GET status + QR
router.get('/status', (req, res) => {
  res.json({ success: true, ...wa.getState() });
});

// Start / connect
router.post('/connect', (req, res) => {
  wa.init();
  res.json({ success: true, message: 'Initializing WhatsApp…' });
});

// Disconnect
router.post('/disconnect', async (req, res) => {
  await wa.disconnect();
  res.json({ success: true, message: 'WhatsApp disconnected' });
});

// Send invoice message
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone)   return res.status(400).json({ success: false, message: 'Phone number required' });
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });
    await wa.sendMessage(phone, message);
    res.json({ success: true, message: 'Sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
