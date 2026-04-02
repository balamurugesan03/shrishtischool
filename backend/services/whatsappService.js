const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let qrDataURL = null;
let status = 'disconnected'; // disconnected | initializing | qr | connected

function getState() {
  return { status, qr: qrDataURL };
}

function init() {
  if (client) return; // already running

  status = 'initializing';
  qrDataURL = null;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    },
  });

  client.on('qr', async (qr) => {
    status = 'qr';
    qrDataURL = await qrcode.toDataURL(qr);
  });

  client.on('loading_screen', () => {
    status = 'initializing';
    qrDataURL = null;
  });

  client.on('authenticated', () => {
    status = 'initializing';
    qrDataURL = null;
  });

  client.on('ready', () => {
    status = 'connected';
    qrDataURL = null;
    console.log('[WhatsApp] Client ready');
  });

  client.on('auth_failure', () => {
    status = 'disconnected';
    qrDataURL = null;
    client = null;
    console.log('[WhatsApp] Auth failed');
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrDataURL = null;
    client = null;
    console.log('[WhatsApp] Disconnected:', reason);
  });

  client.initialize();
}

async function sendMessage(phone, message) {
  if (!client || status !== 'connected') {
    throw new Error('WhatsApp not connected. Please scan QR first.');
  }
  const raw = String(phone).replace(/\D/g, '');
  const intl = raw.length === 10 ? `91${raw}` : raw;
  const chatId = `${intl}@c.us`;
  await client.sendMessage(chatId, message);
}

async function sendDocument(phone, pdfBuffer, filename) {
  if (!client || status !== 'connected') {
    throw new Error('WhatsApp not connected. Please scan QR first.');
  }
  const raw = String(phone).replace(/\D/g, '');
  const intl = raw.length === 10 ? `91${raw}` : raw;
  const chatId = `${intl}@c.us`;
  const media = new MessageMedia('application/pdf', Buffer.from(pdfBuffer).toString('base64'), filename);
  await client.sendMessage(chatId, media, { sendMediaAsDocument: true });
}

async function disconnect() {
  if (client) {
    try { await client.destroy(); } catch (_) {}
    client = null;
  }
  status = 'disconnected';
  qrDataURL = null;
}

module.exports = { init, getState, sendMessage, sendDocument, disconnect };
