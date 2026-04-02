import { useState, useEffect } from 'react';
import {
  Paper, Button, Box, TextField, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, IconButton, Divider, Stack, Grid,
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { studentAPI, productAPI, invoiceAPI } from '../../services/api';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [students, setStudents] = useState([]);
  const [products, setProducts] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    student: '', date: new Date().toISOString().split('T')[0],
    dueDate: '', invoiceType: 'Other', discount: 0, tax: 0, notes: ''
  });
  const [items, setItems] = useState([{ product: '', description: '', quantity: 1, pricePerUnit: 0 }]);

  useEffect(() => {
    Promise.all([
      studentAPI.getAll({ limit: 1000, status: 'Active' }),
      productAPI.getAll({ limit: 1000, status: 'Active' })
    ]).then(([sRes, pRes]) => {
      setStudents(sRes.data.map(s => ({ value: s._id, label: `${s.studentId} - ${s.firstName} ${s.lastName}` })));
      const pData = pRes.data;
      setProducts(pData.map(p => ({ value: p._id, label: `${p.name} (₹${p.price})` })));
      const map = {};
      pData.forEach(p => { map[p._id] = p; });
      setProductMap(map);
    });
  }, []);

  const addItem = () => setItems(prev => [...prev, { product: '', description: '', quantity: 1, pricePerUnit: 0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleProductSelect = (productId, i) => {
    const p = productMap[productId];
    if (p) {
      updateItem(i, 'pricePerUnit', p.price);
      updateItem(i, 'description', p.name);
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
  const total = subtotal - Number(values.discount || 0) + (subtotal * Number(values.tax || 0) / 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.student) { enqueueSnackbar('Please select a student', { variant: 'error' }); return; }
    setLoading(true);
    try {
      const res = await invoiceAPI.create({
        ...values,
        date: values.date ? new Date(values.date) : new Date(),
        dueDate: values.dueDate ? new Date(values.dueDate) : null,
        items
      });
      enqueueSnackbar(`Invoice ${res.data.invoiceNumber} created!`, { variant: 'success' });
      navigate('/billing/invoices');
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <>
      <PageHeader
        title="Create Invoice"
        breadcrumbs={[{ label: 'Billing' }, { label: 'Invoices', path: '/billing/invoices' }, { label: 'Create' }]}
      />
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select label="Student" size="small" fullWidth required
                value={values.student} onChange={set('student')}>
                <MenuItem value="">Select student</MenuItem>
                {students.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select label="Invoice Type" size="small" fullWidth value={values.invoiceType} onChange={set('invoiceType')}>
                {['Inventory','Fee','Other'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="Invoice Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                value={values.date} onChange={set('date')} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField label="Due Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                value={values.dueDate} onChange={set('dueDate')} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Items</Typography>
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product (optional)</TableCell>
                <TableCell>Description</TableCell>
                <TableCell sx={{ width: 80 }}>Qty</TableCell>
                <TableCell sx={{ width: 120 }}>Price (₹)</TableCell>
                <TableCell sx={{ width: 120 }}>Total</TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <TextField select size="small" fullWidth value={item.product}
                      onChange={e => { updateItem(i, 'product', e.target.value); if (e.target.value) handleProductSelect(e.target.value, i); }}>
                      <MenuItem value="">Select product</MenuItem>
                      {products.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField size="small" fullWidth placeholder="Description"
                      value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" fullWidth value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                      inputProps={{ min: 1 }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" fullWidth value={item.pricePerUnit}
                      onChange={e => updateItem(i, 'pricePerUnit', Number(e.target.value))}
                      inputProps={{ min: 0 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>₹{(item.quantity * item.pricePerUnit).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>
                    {items.length > 1 && (
                      <IconButton size="small" color="error" onClick={() => removeItem(i)}><IconTrash size={16} /></IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          </Box>
          <Button variant="text" startIcon={<IconPlus size={14} />} onClick={addItem} sx={{ mb: 2 }}>Add Item</Button>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, mb: 2 }}>
            <Stack spacing={1} width={{ xs: '100%', sm: 280 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight={500}>₹{subtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Discount (₹):</Typography>
                <TextField size="small" type="number" sx={{ width: 100 }} value={values.discount}
                  onChange={set('discount')} inputProps={{ min: 0 }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Tax (%):</Typography>
                <TextField size="small" type="number" sx={{ width: 100 }} value={values.tax}
                  onChange={set('tax')} inputProps={{ min: 0, max: 100 }} />
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" fontWeight={700}>Total:</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary">₹{total.toLocaleString()}</Typography>
              </Box>
            </Stack>
          </Box>

          <TextField label="Notes" multiline rows={2} size="small" fullWidth sx={{ mb: 2 }}
            placeholder="Additional notes" value={values.notes} onChange={set('notes')} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button variant="text" onClick={() => navigate('/billing/invoices')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Creating...' : 'Create Invoice'}
            </Button>
          </Box>
        </form>
      </Paper>
    </>
  );
}
