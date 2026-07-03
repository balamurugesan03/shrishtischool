const fs = require('fs');
const path = require('path');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode');

let client = null;
let qrDataURL = null;
let status = 'disconnected'; // disconnected | initializing | qr | connected

const SESSION_DIR = path.join(process.cwd(), '.wwebjs_auth', 'session');

function getState() {
  return { status, qr: qrDataURL };
}

// Chrome leaves these behind if the previous process didn't exit cleanly
// (crash, force-kill, restart mid-session). A stale lock makes the next
// launch fail with "browser is already running" even though nothing is.
function clearStaleLock() {
  for (const f of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
    try { fs.rmSync(path.join(SESSION_DIR, f), { force: true }); } catch (_) {}
  }
}

function wipeSession() {
  try { fs.rmSync(path.join(process.cwd(), '.wwebjs_auth'), { recursive: true, force: true }); } catch (_) {}
  try { fs.rmSync(path.join(process.cwd(), '.wwebjs_cache'), { recursive: true, force: true }); } catch (_) {}
}

function init() {
  if (client) return; // already running

  status = 'initializing';
  qrDataURL = null;
  clearStaleLock();

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1040156871-alpha.html',
    },
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
      ],
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

  client.on('error', (err) => {
    console.error('[WhatsApp] Client error:', err.message);
  });

  client.on('disconnected', (reason) => {
    status = 'disconnected';
    qrDataURL = null;
    client = null;
    console.log('[WhatsApp] Disconnected:', reason);
    // A LOGOUT means the phone unlinked this session — the saved local
    // profile is now dead. Reusing it on the next connect is what causes
    // the "browser already running" / stuck-initializing retry loop, so
    // wipe it and force a clean QR scan next time.
    if (reason === 'LOGOUT') wipeSession();
  });

  client.initialize().catch((err) => {
    console.error('[WhatsApp] Initialize failed:', err.message);
    status = 'disconnected';
    qrDataURL = null;
    client = null;
  });
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
  // client.destroy() resolves before Chrome has always fully released the
  // profile's lock files on Windows — give it a moment, then clean up any
  // lock left behind so the next /connect doesn't hit "already running".
  await new Promise((r) => setTimeout(r, 1000));
  clearStaleLock();
}

// Close the browser cleanly on restart/shutdown so it doesn't linger and
// lock the session profile for the next process (nodemon sends SIGUSR2).
async function shutdown() {
  if (client) {
    try { await client.destroy(); } catch (_) {}
  }
  process.exit(0);
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
process.once('SIGUSR2', shutdown);

module.exports = { init, getState, sendMessage, sendDocument, disconnect };
