import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid, Box, Typography, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, Button, Divider, Stack, CircularProgress, Chip,
} from '@mui/material';
import { IconPrinter, IconArrowLeft, IconReceipt, IconCheck, IconBrandWhatsapp } from '@tabler/icons-react';
import { invoiceAPI } from '../../services/api';
import { useSnackbar } from 'notistack';
import StatusBadge from '../../components/StatusBadge';
import PageHeader from '../../components/PageHeader';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [waSending, setWaSending] = useState(false);

  useEffect(() => {
    invoiceAPI.getById(id)
      .then(res => setInvoice(res.data || res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><CircularProgress /></Box>;
  if (!invoice) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}><Typography color="text.secondary">Invoice not found</Typography></Box>;

  const s = invoice.student || {};
  const invDate = invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const statusClr = { Paid: '#16a34a', Partial: '#d97706', Pending: '#2563eb', Overdue: '#dc2626' };
  const sc = statusClr[invoice.paymentStatus] || '#6366f1';

  const handleWhatsApp = async () => {
    if (!s.phone) { enqueueSnackbar('Student phone number not available', { variant: 'warning' }); return; }
    setWaSending(true);
    try {
      await invoiceAPI.sendWhatsApp(id);
      enqueueSnackbar(`Invoice PDF sent to ${s.phone} via WhatsApp`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    } finally {
      setWaSending(false);
    }
  };

  const handlePrint = () => {
    const rows = (invoice.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.description || item.product?.name || '—'}</td>
        <td style="text-align:right">${item.quantity ?? 1}</td>
        <td style="text-align:right">${fmt(item.pricePerUnit)}</td>
        <td style="text-align:right;font-weight:600;color:#2563eb">${fmt(item.totalPrice ?? item.quantity * item.pricePerUnit)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Invoice ${invoice.invoiceNumber}</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px;}
.invoice{max-width:740px;margin:0 auto;border:2px solid #6366f1;border-radius:12px;overflow:hidden;}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:flex-start;}
.school-name{font-size:22px;font-weight:800;}.inv-right{text-align:right;}
.inv-right h2{font-size:24px;font-weight:800;letter-spacing:2px;}.inv-right p{font-size:12px;opacity:.75;margin-top:4px;}
.body{padding:28px 32px;}.two-col{display:flex;gap:24px;margin-bottom:24px;}.two-col>div{flex:1;}
.label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.8px;margin-bottom:2px;}.value{font-size:13px;font-weight:600;}
.section-title{font-size:10px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#6366f1;margin-bottom:10px;}
.info-box{background:#f8faff;border:1px solid #e0e7ff;border-radius:8px;padding:14px 18px;margin-bottom:20px;}
table{width:100%;border-collapse:collapse;margin-bottom:20px;}thead tr{background:#6366f1;}
thead th{color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;padding:10px 14px;text-align:left;}
tbody tr:nth-child(even){background:#f8faff;}tbody td{padding:10px 14px;font-size:13px;border-bottom:1px solid #e8ecf4;}
.summary{display:flex;justify-content:flex-end;margin-bottom:20px;}.summary-box{width:280px;border:1px solid #e8ecf4;border-radius:8px;overflow:hidden;}
.summary-row{display:flex;justify-content:space-between;padding:8px 14px;font-size:13px;}
.summary-row.total{background:#6366f1;color:#fff;font-weight:700;font-size:15px;}
.summary-row.paid-row{color:#16a34a;font-weight:600;background:#f0fdf4;}.summary-row.bal{color:#dc2626;font-weight:700;background:#fef2f2;}
.badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:700;background:${sc}22;color:${sc};border:1px solid ${sc}44;}
.footer{display:flex;justify-content:space-between;padding:20px 32px;border-top:2px dashed #e8ecf4;background:#f8faff;}
.sign-box{text-align:center;}.sign-line{border-bottom:1px solid #94a3b8;width:140px;margin:0 auto 6px;}.sign-label{font-size:11px;color:#64748b;}
@media print{body{padding:0;}@page{margin:1cm;}}</style></head>
<body><div class="invoice">
<div class="header"><div><div class="school-name">🎓 Shrishti Kinder International School</div><div style="font-size:12px;opacity:.75;margin-top:4px">School Management System</div></div>
<div class="inv-right"><h2>INVOICE</h2><p>#${invoice.invoiceNumber}</p><p>Date: ${invDate}</p><p>Due: ${dueDate}</p></div></div>
<div class="body"><div class="two-col">
<div><div class="section-title">Bill To</div><div class="info-box">
<div class="label">Student Name</div><div class="value">${s.firstName||''} ${s.lastName||''}</div>
<div style="margin-top:8px"><div class="label">ID</div><div class="value">${s.studentId||'—'}</div></div>
<div style="margin-top:8px"><div class="label">Class</div><div class="value">Class ${s.class||'—'}-${s.section||'—'}</div></div></div></div>
<div><div class="section-title">Invoice Info</div><div class="info-box">
<div class="label">Type</div><div class="value">${invoice.invoiceType||'—'}</div>
<div style="margin-top:8px"><div class="label">Status</div><div class="value"><span class="badge">${invoice.paymentStatus||'Pending'}</span></div></div></div></div></div>
<div class="section-title">Items</div>
<table><thead><tr><th>#</th><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
<tbody>${rows||'<tr><td colspan="5" style="text-align:center;color:#94a3b8">No items</td></tr>'}</tbody></table>
<div class="summary"><div class="summary-box">
<div class="summary-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
${invoice.discount>0?`<div class="summary-row" style="color:#16a34a"><span>Discount</span><span>-${fmt(invoice.discount)}</span></div>`:''}
${invoice.tax>0?`<div class="summary-row"><span>Tax (${invoice.tax}%)</span><span>${fmt((invoice.subtotal*invoice.tax)/100)}</span></div>`:''}
<div class="summary-row total"><span>Total</span><span>${fmt(invoice.totalAmount)}</span></div>
<div class="summary-row paid-row"><span>Paid</span><span>${fmt(invoice.paidAmount)}</span></div>
<div class="summary-row bal"><span>Balance</span><span>${fmt(invoice.balance)}</span></div></div></div></div>
<div class="footer">
<div class="sign-box"><div class="sign-line"></div><div class="sign-label">Parent / Guardian</div></div>
<div class="sign-box"><div class="sign-line"></div><div class="sign-label">Cashier / Accountant</div></div>
<div class="sign-box"><div class="sign-line"></div><div class="sign-label">Principal</div></div></div>
<div style="font-size:10px;color:#94a3b8;text-align:center;padding:10px 32px 16px">Computer-generated invoice. No signature required if printed.</div>
</div><script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open('', '_blank', 'width=820,height=950');
    win.document.write(html);
    win.document.close();
  };

  return (
    <>
      <PageHeader
        title={`Invoice #${invoice.invoiceNumber}`}
        breadcrumbs={[{ label: 'Billing' }, { label: 'Invoices', path: '/billing/invoices' }, { label: invoice.invoiceNumber }]}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="text" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate('/billing/invoices')}>Back</Button>
            <Button
              variant="contained"
              startIcon={waSending ? <CircularProgress size={14} color="inherit" /> : <IconBrandWhatsapp size={16} />}
              onClick={handleWhatsApp}
              disabled={waSending}
              sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5c' } }}
            >
              WhatsApp
            </Button>
            <Button variant="contained" color="secondary" startIcon={<IconPrinter size={16} />} onClick={handlePrint}>Print</Button>
          </Box>
        }
      />

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {/* Header */}
        <Grid container mb={3}>
          <Grid item xs={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 1.5, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconReceipt size={22} color="#fff" />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="primary">Shrishti Kinder International School</Typography>
                <Typography variant="caption" color="text.secondary">School Management System</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={6} sx={{ textAlign: 'right' }}>
            <Typography variant="h5" fontWeight={800} color="primary">INVOICE</Typography>
            <Typography variant="body2" color="text.secondary">#{invoice.invoiceNumber}</Typography>
            <Box mt={0.5}><StatusBadge status={invoice.paymentStatus} /></Box>
          </Grid>
        </Grid>

        {/* Student + Info */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Bill To</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 1.5 }}>
              <Typography fontWeight={700}>{s.firstName} {s.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">ID: {s.studentId}</Typography>
              <Typography variant="body2" color="text.secondary">Class {s.class}-{s.section}</Typography>
              {s.phone && <Typography variant="body2" color="text.secondary">📞 {s.phone}</Typography>}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Invoice Info</Typography>
            <Paper variant="outlined" sx={{ p: 2, mt: 1, borderRadius: 1.5 }}>
              <Stack spacing={0.75}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body2" fontWeight={500}>{invDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body2" fontWeight={500}>{dueDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Chip label={invoice.invoiceType} size="small" variant="outlined" sx={{ height: 20, fontSize: '11px' }} />
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Items */}
        <Typography variant="caption" fontWeight={700} color="primary" sx={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Items</Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ mt: 1, mb: 3 }}>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoice.items || []).map((item, i) => (
                <TableRow key={i} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.description || item.product?.name || '—'}</TableCell>
                  <TableCell align="right">{item.quantity ?? 1}</TableCell>
                  <TableCell align="right">{fmt(item.pricePerUnit)}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="primary">
                      {fmt(item.totalPrice ?? item.quantity * item.pricePerUnit)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Summary */}
        <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mb: 3 }}>
          <Stack spacing={0.75} width={{ xs: '100%', sm: 280 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2" fontWeight={500}>{fmt(invoice.subtotal)}</Typography>
            </Box>
            {invoice.discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="success.main">Discount</Typography>
                <Typography variant="body2" color="success.main">-{fmt(invoice.discount)}</Typography>
              </Box>
            )}
            {invoice.tax > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Tax ({invoice.tax}%)</Typography>
                <Typography variant="body2">{fmt((invoice.subtotal * invoice.tax) / 100)}</Typography>
              </Box>
            )}
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="primary">{fmt(invoice.totalAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconCheck size={14} color="#16a34a" />
                <Typography variant="body2" color="success.main">Paid</Typography>
              </Box>
              <Typography variant="body2" color="success.main" fontWeight={600}>{fmt(invoice.paidAmount)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" fontWeight={600} color={invoice.balance > 0 ? 'error.main' : 'success.main'}>Balance</Typography>
              <Typography variant="body2" fontWeight={700} color={invoice.balance > 0 ? 'error.main' : 'success.main'}>{fmt(invoice.balance)}</Typography>
            </Box>
          </Stack>
        </Box>

        {invoice.notes && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary"><strong>Notes:</strong> {invoice.notes}</Typography>
          </>
        )}
      </Paper>
    </>
  );
}
