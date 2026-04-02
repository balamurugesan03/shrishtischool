import { useState, useEffect, useMemo } from 'react';
import {
  Paper, Button, Box, TextField, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, IconButton, Divider, Stack, Grid,
  Card, CardContent, Chip, Alert,
} from '@mui/material';
import { IconPlus, IconTrash, IconCheck, IconCash, IconDeviceMobile, IconReceipt, IconCalculator, IconUser, IconPackage } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import { studentAPI, productAPI, inventoryAPI } from '../../services/api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const INIT = { student: '', issuedBy: '', notes: '', cashAmount: 0, gpayAmount: 0 };

function SummaryCard({ label, value, color, icon: Icon, iconColor }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
            {label}
          </Typography>
          {Icon && (
            <Box sx={{ width: 22, height: 22, borderRadius: 1, bgcolor: `${color}.light` || 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={13} color={iconColor} />
            </Box>
          )}
        </Box>
        <Typography variant="h6" fontWeight={800} color={color}>{value}</Typography>
      </CardContent>
    </Card>
  );
}

export default function IssueInventory() {
  const { enqueueSnackbar } = useSnackbar();
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [values, setValues] = useState(INIT);
  const [items, setItems] = useState([{ product: '', quantity: 1 }]);

  useEffect(() => {
    Promise.all([
      studentAPI.getAll({ limit: 1000, status: 'Active' }),
      productAPI.getAll({ limit: 1000, status: 'Active' }),
    ]).then(([sRes, pRes]) => {
      setStudents(sRes.data.map(s => ({
        value: s._id,
        label: `${s.studentId} – ${s.firstName} ${s.lastName} (${s.class}-${s.section})`,
      })));
      const pData = pRes.data;
      setProducts(pData.map(p => ({
        value: p._id,
        label: `${p.productCode} – ${p.name}  (Stock: ${p.currentStock})`,
      })));
      const map = {};
      pData.forEach(p => { map[p._id] = p; });
      setProductMap(map);
    });
  }, []);

  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }));
  const addItem = () => setItems(prev => [...prev, { product: '', quantity: 1 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => {
      const p = productMap[item.product];
      return sum + (p ? p.price * item.quantity : 0);
    }, 0),
    [items, productMap]
  );

  const cashPaid  = Number(values.cashAmount  || 0);
  const gpayPaid  = Number(values.gpayAmount  || 0);
  const totalPaid = cashPaid + gpayPaid;
  const balance   = Math.max(0, totalAmount - totalPaid);
  const overpaid  = totalPaid > totalAmount ? totalPaid - totalAmount : 0;

  const paymentStatus =
    totalAmount === 0 ? 'Pending'
    : balance <= 0    ? 'Paid'
    : totalPaid > 0   ? 'Partial'
    : 'Pending';

  const paymentMode =
    cashPaid > 0 && gpayPaid > 0 ? 'Mixed'
    : cashPaid > 0 ? 'Cash'
    : gpayPaid > 0 ? 'GPay / UPI'
    : 'Pending';

  const statusColor = { Paid: 'success', Partial: 'warning', Pending: 'error' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.every(i => !i.product)) {
      enqueueSnackbar('Add at least one item', { variant: 'error' });
      return;
    }
    if (!values.student) {
      enqueueSnackbar('Select a student', { variant: 'error' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        student:  values.student,
        items:    items.filter(i => i.product),
        issuedBy: values.issuedBy,
        notes:    values.notes,
        payment: {
          cashAmount:    cashPaid,
          gpayAmount:    gpayPaid,
          totalPaid,
          balance,
          paymentMode,
          paymentStatus,
        },
      };
      const res = await inventoryAPI.issue(payload);
      setSavedInvoice(res.invoice || res.data?.invoice || res);
      enqueueSnackbar('Inventory issued! Invoice generated.', { variant: 'success' });
      setValues(INIT);
      setItems([{ product: '', quantity: 1 }]);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Issue Inventory"
        subtitle="Issue items to a student and collect payment"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Issue Inventory' }]}
      />

      {/* Success banner */}
      {savedInvoice && (
        <Alert
          severity="success"
          icon={<IconCheck size={18} />}
          action={<Button size="small" color="success" onClick={() => setSavedInvoice(null)}>Dismiss</Button>}
          sx={{ mb: 2, borderRadius: 1.5 }}
        >
          <strong>Inventory Issued Successfully!</strong> Invoice <strong>{savedInvoice?.invoiceNumber || '—'}</strong>
          &nbsp;• Total {fmt(totalAmount)} • Paid {fmt(totalPaid)} • Balance {fmt(balance)}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>

        {/* Section 1: Student & Staff */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 24, height: 24, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUser size={13} color="#fff" />
            </Box>
            <Typography variant="body2" fontWeight={700}>Student Details</Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select label="Student" size="small" fullWidth required value={values.student} onChange={set('student')}>
                <MenuItem value="">Search & select student…</MenuItem>
                {students.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Issued By" size="small" fullWidth value={values.issuedBy} onChange={set('issuedBy')}>
                <MenuItem value="">Select staff role</MenuItem>
                {['Principal','Teacher','Admin','Librarian','Lab Assistant'].map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Section 2: Items */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 24, height: 24, bgcolor: 'warning.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconPackage size={13} color="#fff" />
            </Box>
            <Typography variant="body2" fontWeight={700}>Items to Issue</Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ mb: 1.5 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell sx={{ width: 110 }}>Qty</TableCell>
                <TableCell sx={{ width: 120 }}>Unit Price</TableCell>
                <TableCell sx={{ width: 130 }}>Total</TableCell>
                <TableCell sx={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, i) => {
                const product = productMap[item.product];
                return (
                  <TableRow key={i}>
                    <TableCell>
                      <TextField select size="small" fullWidth value={item.product}
                        onChange={e => updateItem(i, 'product', e.target.value)}>
                        <MenuItem value="">Select product</MenuItem>
                        {products.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" fullWidth value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                        inputProps={{ min: 1, max: product?.currentStock || 999 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {product ? fmt(product.price) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {product ? fmt(product.price * item.quantity) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {items.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => removeItem(i)}>
                          <IconTrash size={15} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </Box>

          <Button variant="text" size="small" startIcon={<IconPlus size={13} />} onClick={addItem}>
            Add Item
          </Button>
        </Paper>

        {/* Section 3: Payment */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ width: 24, height: 24, bgcolor: 'success.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCalculator size={13} color="#fff" />
            </Box>
            <Typography variant="body2" fontWeight={700}>Payment Collection</Typography>
            <Box ml="auto">
              <Chip label={paymentStatus} size="small" color={statusColor[paymentStatus]} variant="outlined"
                sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} />
            </Box>
          </Box>

          {/* Summary cards */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <SummaryCard label="Total Amount" value={fmt(totalAmount)} color="primary" icon={IconReceipt} iconColor="#6366f1" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard label="Cash Paid" value={fmt(cashPaid)} color="success" icon={IconCash} iconColor="#14b8a6" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard label="GPay / UPI" value={fmt(gpayPaid)} color="secondary" icon={IconDeviceMobile} iconColor="#8b5cf6" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <SummaryCard
                label={balance > 0 ? 'Balance Due' : overpaid > 0 ? 'Overpaid' : 'Balance'}
                value={balance > 0 ? fmt(balance) : overpaid > 0 ? fmt(overpaid) : '₹0'}
                color={balance > 0 ? 'error' : 'success'}
                icon={IconCalculator}
                iconColor={balance > 0 ? '#ef4444' : '#10b981'}
              />
            </Grid>
          </Grid>

          {/* Payment inputs */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cash Amount (₹)"
                type="number"
                size="small"
                fullWidth
                value={values.cashAmount}
                onChange={set('cashAmount')}
                inputProps={{ min: 0 }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 0.5, display: 'flex' }}><IconCash size={16} color="#14b8a6" /></Box>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="GPay / UPI Amount (₹)"
                type="number"
                size="small"
                fullWidth
                value={values.gpayAmount}
                onChange={set('gpayAmount')}
                inputProps={{ min: 0 }}
                InputProps={{
                  startAdornment: <Box sx={{ mr: 0.5, display: 'flex' }}><IconDeviceMobile size={16} color="#8b5cf6" /></Box>
                }}
              />
            </Grid>
          </Grid>

          {/* Live breakdown */}
          <Card variant="outlined" sx={{ borderRadius: 1.5, bgcolor: 'action.hover' }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack spacing={0.75}>
                {[
                  ['Subtotal', fmt(totalAmount), 'text.secondary', 'text.primary'],
                  ['Cash paid', fmt(cashPaid), 'text.secondary', 'success.main'],
                  ['GPay / UPI paid', fmt(gpayPaid), 'text.secondary', 'secondary.main'],
                  ['Total Paid', fmt(totalPaid), 'text.secondary', 'text.primary'],
                ].map(([label, value, lc, vc]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color={lc}>{label}</Typography>
                    <Typography variant="body2" fontWeight={500} color={vc}>{value}</Typography>
                  </Box>
                ))}
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={700}>
                    {balance > 0 ? 'Balance Due' : overpaid > 0 ? 'Change / Refund' : 'Settled'}
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} color={balance > 0 ? 'error.main' : 'success.main'}>
                    {balance > 0 ? fmt(balance) : overpaid > 0 ? fmt(overpaid) : '₹0'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Payment mode</Typography>
                  <Chip label={paymentMode} size="small" variant="outlined" sx={{ height: 18, fontSize: '10px' }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Paper>

        {/* Notes & Submit */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <TextField
            label="Notes / Remarks"
            placeholder="Any additional notes..."
            multiline
            rows={2}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
            value={values.notes}
            onChange={set('notes')}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              color={paymentStatus === 'Paid' ? 'success' : 'primary'}
              startIcon={<IconReceipt size={17} />}
            >
              {loading ? 'Saving...' : 'Issue & Save Invoice'}
            </Button>
          </Box>
        </Paper>

      </form>
    </>
  );
}
