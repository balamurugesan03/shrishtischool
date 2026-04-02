import { useState, useEffect, useCallback } from 'react';
import {
  Button, IconButton, Tooltip, Box, Typography, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconEye, IconCurrencyRupee, IconTrash, IconBrandWhatsapp } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { invoiceAPI, whatsappAPI } from '../../services/api';

export default function InvoiceList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentValues, setPaymentValues] = useState({ amount: 0, paymentMode: 'Cash', notes: '' });

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceAPI.getAll({ page, limit, search, paymentStatus: filterStatus, invoiceType: filterType });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus, filterType]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await invoiceAPI.delete(deleteId);
      enqueueSnackbar('Invoice deleted', { variant: 'success' });
      setConfirmOpen(false);
      fetchInvoices();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      await invoiceAPI.recordPayment(paymentInvoice._id, paymentValues);
      enqueueSnackbar('Payment recorded', { variant: 'success' });
      setPaymentOpen(false);
      fetchInvoices();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setPaymentLoading(false);
    }
  };

  const sendWhatsApp = async (row) => {
    if (!row.student?.phone) { enqueueSnackbar('Student phone number not available', { variant: 'warning' }); return; }
    const invDate = row.date ? new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const dueDate = row.dueDate ? new Date(row.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

    const msg = [
      `🎓 *Shrishti Kinder International School*`,
      `📄 Invoice: *#${row.invoiceNumber}*`,
      ``,
      `Dear *${row.student?.firstName || ''} ${row.student?.lastName || ''}*,`,
      `*Invoice Date:* ${invDate}`,
      row.dueDate ? `*Due Date:* ${dueDate}` : null,
      ``,
      `*Total:* ${fmt(row.totalAmount)}`,
      `✅ *Paid:* ${fmt(row.paidAmount)}`,
      `${row.balance > 0 ? '⚠️' : '✅'} *Balance:* ${fmt(row.balance)}`,
      `*Status:* ${row.paymentStatus}`,
      ``,
      `Thank you! 🙏`,
    ].filter(Boolean).join('\n');

    try {
      await whatsappAPI.send(row.student.phone, msg);
      enqueueSnackbar(`Sent to ${row.student.phone}`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: v => <Typography variant="body2" fontWeight={500} color="primary">{v}</Typography> },
    { key: 'student', label: 'Student', render: v => <Typography variant="body2">{v?.firstName} {v?.lastName}</Typography> },
    { key: 'invoiceType', label: 'Type', render: v => <Chip label={v} size="small" variant="outlined" sx={{ height: 20, fontSize: '11px' }} /> },
    { key: 'totalAmount', label: 'Total', render: v => `₹${v?.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', render: v => <Typography variant="body2" color="success.main">₹{v?.toLocaleString()}</Typography> },
    { key: 'balance', label: 'Balance', render: v => <Typography variant="body2" color={v > 0 ? 'error.main' : 'success.main'}>₹{v?.toLocaleString()}</Typography> },
    { key: 'paymentStatus', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Invoice">
            <IconButton size="small" color="primary" onClick={() => navigate(`/billing/invoices/${row._id}`)}>
              <IconEye size={16} />
            </IconButton>
          </Tooltip>
          {row.balance > 0 && (
            <Tooltip title="Record Payment">
              <IconButton size="small" color="success" onClick={() => {
                setPaymentInvoice(row);
                setPaymentValues({ amount: row.balance, paymentMode: 'Cash', notes: '' });
                setPaymentOpen(true);
              }}>
                <IconCurrencyRupee size={16} />
              </IconButton>
            </Tooltip>
          )}
          {row.student?.phone && (
            <Tooltip title="Send WhatsApp">
              <IconButton size="small" onClick={() => sendWhatsApp(row)}
                sx={{ color: '#25D366', '&:hover': { bgcolor: 'rgba(37,211,102,0.1)' } }}>
                <IconBrandWhatsapp size={16} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => { setDeleteId(row._id); setConfirmOpen(true); }}>
              <IconTrash size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <>
      <PageHeader
        title="Invoices" subtitle="View and manage all invoices"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => navigate('/billing/invoices/create')}>Create Invoice</Button>}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField select size="small" label="Payment Status" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }} sx={{ width: 160 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {['Pending','Partial','Paid','Overdue'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Invoice Type" value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }} sx={{ width: 160 }}>
          <MenuItem value="">All Types</MenuItem>
          {['Inventory','Fee','Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }}
        onSearch={s => { setSearch(s); setPage(1); }} searchPlaceholder="Search invoices..." />

      {/* Payment modal */}
      <Dialog open={paymentOpen} onClose={() => setPaymentOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handlePayment}>
          <DialogTitle fontWeight={700}>Record Payment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Invoice: <strong>{paymentInvoice?.invoiceNumber}</strong> | Balance: <strong>₹{paymentInvoice?.balance?.toLocaleString()}</strong>
            </Typography>
            <Stack spacing={2}>
              <TextField label="Amount (₹)" type="number" size="small" fullWidth required
                value={paymentValues.amount}
                onChange={e => setPaymentValues(p => ({ ...p, amount: Number(e.target.value) }))}
                inputProps={{ min: 1, max: paymentInvoice?.balance }} />
              <TextField select label="Payment Mode" size="small" fullWidth
                value={paymentValues.paymentMode}
                onChange={e => setPaymentValues(p => ({ ...p, paymentMode: e.target.value }))}>
                {['Cash','Cheque','Online','Card','UPI'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setPaymentOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={paymentLoading}>
              {paymentLoading ? 'Saving...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmModal opened={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        loading={deleteLoading} title="Delete Invoice" />
    </>
  );
}
