const puppeteer = require('puppeteer');

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function buildFeeHTML(fee) {
  const s = fee.student || {};
  const statusClr = { Paid: '#16a34a', Partial: '#d97706', Pending: '#2563eb', Overdue: '#dc2626' };
  const sc = statusClr[fee.status] || '#6366f1';

  const dueDate = fee.dueDate
    ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const payDate = fee.paymentDate
    ? new Date(fee.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Fee Receipt - ${s.firstName || ''} ${s.lastName || ''}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;}
    .receipt{max-width:620px;margin:0 auto;border:2px solid #0ea5e9;border-radius:12px;overflow:hidden;}
    .header{background:linear-gradient(135deg,#0ea5e9,#6366f1);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
    .school-name{font-size:20px;font-weight:800;}
    .school-sub{font-size:11px;opacity:.75;margin-top:4px;}
    .rec-right{text-align:right;}
    .rec-right h2{font-size:22px;font-weight:800;letter-spacing:2px;}
    .rec-right p{font-size:11px;opacity:.75;margin-top:3px;}
    .body{padding:24px 32px;}
    .section-title{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#0ea5e9;margin-bottom:8px;}
    .info-box{background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px 18px;margin-bottom:18px;}
    .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e0f2fe;font-size:13px;}
    .row:last-child{border-bottom:none;}
    .row .lbl{color:#64748b;}
    .row .val{font-weight:600;}
    .amount-box{background:#f0f9ff;border:2px solid #0ea5e9;border-radius:10px;padding:18px 24px;margin-bottom:18px;}
    .amount-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #bae6fd;}
    .amount-row:last-child{border-bottom:none;}
    .amount-row.total{font-size:15px;font-weight:800;color:#0ea5e9;padding-top:10px;}
    .amount-row.paid{color:#16a34a;font-weight:600;}
    .amount-row.bal{font-weight:700;}
    .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44;}
    .footer{display:flex;justify-content:space-between;padding:18px 32px;border-top:2px dashed #bae6fd;background:#f0f9ff;}
    .sign-box{text-align:center;}
    .sign-line{border-bottom:1px solid #94a3b8;width:110px;margin:0 auto 5px;}
    .sign-label{font-size:10px;color:#64748b;}
    .note{font-size:10px;color:#94a3b8;text-align:center;padding:8px 32px 14px;}
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div>
      <div class="school-name">🎓 Shrishti Kinder International School</div>
      <div class="school-sub">School Management System</div>
    </div>
    <div class="rec-right">
      <h2>FEE RECEIPT</h2>
      <p>Due: ${dueDate}</p>
      ${fee.academicYear ? `<p>Year: ${fee.academicYear}</p>` : ''}
      ${fee.term ? `<p>Term: ${fee.term}</p>` : ''}
    </div>
  </div>

  <div class="body">
    <div class="section-title">Student Details</div>
    <div class="info-box">
      <div class="row"><span class="lbl">Name</span><span class="val">${s.firstName || ''} ${s.lastName || ''}</span></div>
      <div class="row"><span class="lbl">Student ID</span><span class="val">${s.studentId || '—'}</span></div>
      <div class="row"><span class="lbl">Class</span><span class="val">Class ${s.class || '—'} - ${s.section || '—'}</span></div>
      ${s.phone ? `<div class="row"><span class="lbl">Phone</span><span class="val">${s.phone}</span></div>` : ''}
    </div>

    <div class="section-title">Fee Details</div>
    <div class="info-box">
      <div class="row"><span class="lbl">Fee Type</span><span class="val">${fee.feeType || '—'}</span></div>
      <div class="row"><span class="lbl">Due Date</span><span class="val">${dueDate}</span></div>
      <div class="row"><span class="lbl">Status</span><span class="val"><span class="badge">${fee.status || 'Pending'}</span></span></div>
      ${fee.paymentMode ? `<div class="row"><span class="lbl">Payment Mode</span><span class="val">${fee.paymentMode}</span></div>` : ''}
      ${fee.paymentDate ? `<div class="row"><span class="lbl">Payment Date</span><span class="val">${payDate}</span></div>` : ''}
      ${fee.receiptNumber ? `<div class="row"><span class="lbl">Receipt No.</span><span class="val">${fee.receiptNumber}</span></div>` : ''}
    </div>

    <div class="section-title">Amount Summary</div>
    <div class="amount-box">
      <div class="amount-row total"><span>Total Amount</span><span>${fmt(fee.amount)}</span></div>
      <div class="amount-row paid"><span>✅ Paid</span><span>${fmt(fee.paidAmount)}</span></div>
      <div class="amount-row bal" style="color:${fee.balance > 0 ? '#dc2626' : '#16a34a'}">
        <span>${fee.balance > 0 ? 'Balance Due' : '✅ Settled'}</span>
        <span>${fmt(fee.balance)}</span>
      </div>
    </div>

    ${fee.notes ? `<div style="font-size:12px;color:#64748b;margin-bottom:12px"><strong>Notes:</strong> ${fee.notes}</div>` : ''}
  </div>

  <div class="footer">
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Parent / Guardian</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Cashier / Accountant</div></div>
    <div class="sign-box"><div class="sign-line"></div><div class="sign-label">Principal</div></div>
  </div>
  <div class="note">Computer-generated receipt. No signature required if printed.</div>
</div>
</body>
</html>`;
}

async function generateFeePDF(fee) {
  const html = buildFeeHTML(fee);
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

module.exports = { generateFeePDF };
