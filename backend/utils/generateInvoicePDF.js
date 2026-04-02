const puppeteer = require('puppeteer');

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function buildInvoiceHTML(invoice) {
  const s = invoice.student || {};
  const statusClr = { Paid: '#16a34a', Partial: '#d97706', Pending: '#2563eb', Overdue: '#dc2626' };
  const sc = statusClr[invoice.paymentStatus] || '#6366f1';

  const invDate = invoice.date
    ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const rows = (invoice.items || []).map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.description || item.product?.name || '—'}</td>
      <td style="text-align:right">${item.quantity ?? 1}</td>
      <td style="text-align:right">${fmt(item.pricePerUnit)}</td>
      <td style="text-align:right;font-weight:600;color:#2563eb">${fmt(item.totalPrice ?? item.quantity * item.pricePerUnit)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;}
    .invoice{max-width:720px;margin:0 auto;border:2px solid #6366f1;border-radius:12px;overflow:hidden;}
    .header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
    .school-name{font-size:20px;font-weight:800;}
    .school-sub{font-size:11px;opacity:.75;margin-top:4px;}
    .inv-right{text-align:right;}
    .inv-right h2{font-size:22px;font-weight:800;letter-spacing:2px;}
    .inv-right p{font-size:11px;opacity:.75;margin-top:3px;}
    .body{padding:24px 32px;}
    .two-col{display:flex;gap:20px;margin-bottom:20px;}
    .two-col>div{flex:1;}
    .section-title{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#6366f1;margin-bottom:8px;}
    .info-box{background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:12px 16px;}
    .label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.6px;margin-bottom:2px;}
    .value{font-size:13px;font-weight:600;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;}
    thead tr{background:#6366f1;}
    thead th{color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;padding:9px 12px;text-align:left;}
    tbody tr:nth-child(even){background:#f8faff;}
    tbody td{padding:9px 12px;font-size:12px;border-bottom:1px solid #e8ecf4;}
    .summary{display:flex;justify-content:flex-end;margin-bottom:16px;}
    .summary-box{width:260px;border:1px solid #e8ecf4;border-radius:8px;overflow:hidden;}
    .summary-row{display:flex;justify-content:space-between;padding:7px 12px;font-size:12px;}
    .summary-row.total{background:#6366f1;color:#fff;font-weight:700;font-size:14px;}
    .summary-row.paid-row{color:#16a34a;font-weight:600;background:#f0fdf4;}
    .summary-row.bal{font-weight:700;background:#fef2f2;color:#dc2626;}
    .summary-row.bal.settled{background:#f0fdf4;color:#16a34a;}
    .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44;}
    .footer{display:flex;justify-content:space-between;padding:18px 32px;border-top:2px dashed #e8ecf4;background:#f8faff;}
    .sign-box{text-align:center;}
    .sign-line{border-bottom:1px solid #94a3b8;width:120px;margin:0 auto 5px;}
    .sign-label{font-size:10px;color:#64748b;}
    .note{font-size:10px;color:#94a3b8;text-align:center;padding:8px 32px 14px;}
  </style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <div>
      <div class="school-name">🎓 Shrishti Kinder International School</div>
      <div class="school-sub">School Management System</div>
    </div>
    <div class="inv-right">
      <h2>INVOICE</h2>
      <p>#${invoice.invoiceNumber}</p>
      <p>Date: ${invDate}</p>
      <p>Due: ${dueDate}</p>
    </div>
  </div>

  <div class="body">
    <div class="two-col">
      <div>
        <div class="section-title">Bill To</div>
        <div class="info-box">
          <div class="label">Student Name</div>
          <div class="value">${s.firstName || ''} ${s.lastName || ''}</div>
          <div style="margin-top:8px"><div class="label">Student ID</div><div class="value">${s.studentId || '—'}</div></div>
          <div style="margin-top:8px"><div class="label">Class</div><div class="value">Class ${s.class || '—'} - ${s.section || '—'}</div></div>
          ${s.phone ? `<div style="margin-top:8px"><div class="label">Phone</div><div class="value">${s.phone}</div></div>` : ''}
        </div>
      </div>
      <div>
        <div class="section-title">Invoice Info</div>
        <div class="info-box">
          <div class="label">Type</div><div class="value">${invoice.invoiceType || '—'}</div>
          <div style="margin-top:8px"><div class="label">Status</div><div class="value"><span class="badge">${invoice.paymentStatus || 'Pending'}</span></div></div>
          <div style="margin-top:8px"><div class="label">Academic Year</div><div class="value">2026–27</div></div>
        </div>
      </div>
    </div>

    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>#</th><th>Description</th>
          <th style="text-align:right">Qty</th>
          <th style="text-align:right">Unit Price</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:12px">No items</td></tr>'}
      </tbody>
    </table>

    <div class="summary">
      <div class="summary-box">
        <div class="summary-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
        ${invoice.discount > 0 ? `<div class="summary-row" style="color:#16a34a"><span>Discount</span><span>-${fmt(invoice.discount)}</span></div>` : ''}
        ${invoice.tax > 0 ? `<div class="summary-row"><span>Tax (${invoice.tax}%)</span><span>${fmt((invoice.subtotal * invoice.tax) / 100)}</span></div>` : ''}
        <div class="summary-row total"><span>Total</span><span>${fmt(invoice.totalAmount)}</span></div>
        <div class="summary-row paid-row"><span>✅ Paid</span><span>${fmt(invoice.paidAmount)}</span></div>
        <div class="summary-row bal ${invoice.balance <= 0 ? 'settled' : ''}">
          <span>${invoice.balance > 0 ? 'Balance Due' : '✅ Settled'}</span>
          <span>${fmt(invoice.balance)}</span>
        </div>
      </div>
    </div>

    ${invoice.notes ? `<div style="font-size:12px;color:#64748b;margin-bottom:12px"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
  </div>

  <div class="footer">
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Parent / Guardian</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Cashier / Accountant</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Principal</div></div>
  </div>
  <div class="note">Computer-generated invoice. No signature required if printed.</div>
</div>
</body>
</html>`;
}

async function generateInvoicePDF(invoice) {
  const html = buildInvoiceHTML(invoice);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

module.exports = { generateInvoicePDF };
