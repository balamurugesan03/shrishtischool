import { useState, useEffect } from 'react';
import {
  Paper, Button, Box, TextField, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Typography, IconButton, Divider, Stack, Grid,
} from '@mui/material';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import { productAPI } from '../../services/api';

export default function PurchaseEntry() {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState({
    supplier: '', date: new Date().toISOString().split('T')[0], notes: '', paidAmount: 0
  });
  const [items, setItems] = useState([{ product: '', quantity: 1, costPrice: 0 }]);

  useEffect(() => {
    productAPI.getAll({ limit: 1000 }).then(res =>
      setProducts(res.data.map(p => ({ value: p._id, label: `${p.productCode} - ${p.name}` })))
    );
  }, []);

  const addItem = () => setItems(prev => [...prev, { product: '', quantity: 1, costPrice: 0 }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await productAPI.createPurchase({ ...values, date: new Date(values.date), items, totalAmount });
      enqueueSnackbar('Purchase entry created and stock updated', { variant: 'success' });
      setValues({ supplier: '', date: new Date().toISOString().split('T')[0], notes: '', paidAmount: 0 });
      setItems([{ product: '', quantity: 1, costPrice: 0 }]);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Purchase Entry" subtitle="Add new stock purchase"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Purchase Entry' }]} />
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Supplier Name" size="small" fullWidth value={values.supplier} onChange={set('supplier')} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField label="Purchase Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                value={values.date} onChange={set('date')} />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Items</Typography>
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell sx={{ width: 100 }}>Qty</TableCell>
                <TableCell sx={{ width: 140 }}>Cost Price (₹)</TableCell>
                <TableCell sx={{ width: 120 }}>Total (₹)</TableCell>
                <TableCell sx={{ width: 60 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, i) => (
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
                      onChange={e => updateItem(i, 'quantity', Number(e.target.value))} inputProps={{ min: 1 }} />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" fullWidth value={item.costPrice}
                      onChange={e => updateItem(i, 'costPrice', Number(e.target.value))} inputProps={{ min: 0 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>₹{(item.quantity * item.costPrice).toLocaleString()}</Typography>
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

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4} sx={{ ml: 'auto' }}>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={500}>Total Amount:</Typography>
                  <Typography variant="subtitle2" fontWeight={700} color="primary">₹{totalAmount.toLocaleString()}</Typography>
                </Box>
                <TextField label="Paid Amount (₹)" type="number" size="small" fullWidth value={values.paidAmount} onChange={set('paidAmount')} inputProps={{ min: 0, max: totalAmount }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Balance:</Typography>
                  <Typography variant="body2" fontWeight={600} color="error.main">₹{(totalAmount - Number(values.paidAmount)).toLocaleString()}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <TextField label="Notes" multiline rows={2} size="small" fullWidth sx={{ mt: 2, mb: 2 }}
            value={values.notes} onChange={set('notes')} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Purchase Entry'}
            </Button>
          </Box>
        </form>
      </Paper>
    </>
  );
}
