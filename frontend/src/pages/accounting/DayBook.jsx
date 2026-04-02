import { useState, useEffect, useCallback } from 'react';
import {
  Button, Box, Typography, TextField, MenuItem, Grid, Paper, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
} from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { daybookAPI } from '../../services/api';

const INIT = { date: new Date().toISOString().split('T')[0], type: 'Income', description: '', amount: 0, category: '', paymentMode: 'Cash', notes: '' };

export default function DayBook() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState(INIT);

  const fetchDayBook = useCallback(async () => {
    setLoading(true);
    try {
      const res = await daybookAPI.getAll({ page, limit, type: filterType, startDate: startDate || undefined, endDate: endDate || undefined });
      setData(res.data);
      setTotal(res.pagination.total);
      setSummary(res.summary || {});
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, startDate, endDate]);

  useEffect(() => { fetchDayBook(); }, [fetchDayBook]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await daybookAPI.create({ ...formValues, date: formValues.date ? new Date(formValues.date) : new Date() });
      enqueueSnackbar('Entry added to Day Book, Cash Book & Ledger', { variant: 'success' });
      setFormOpen(false); fetchDayBook();
      setFormValues(INIT);
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const set = (field) => (e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }));
  const net = (summary.Income || 0) - (summary.Expense || 0);

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString() },
    { key: 'voucherNumber', label: 'Voucher #' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'type', label: 'Type', render: v => <Chip label={v} size="small" color={v === 'Income' ? 'success' : 'error'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /> },
    { key: 'amount', label: 'Amount', render: (v, row) => <Typography variant="body2" fontWeight={500} color={row.type === 'Income' ? 'success.main' : 'error.main'}>₹{v?.toLocaleString()}</Typography> },
    { key: 'paymentMode', label: 'Mode' }
  ];

  return (
    <>
      <PageHeader title="Day Book" subtitle="Daily income and expense register"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => setFormOpen(true)}>Add Entry</Button>} />

      <Grid container spacing={2} mb={2}>
        {[
          { label: 'Total Income', value: `₹${(summary.Income || 0).toLocaleString()}`, color: 'success.main' },
          { label: 'Total Expense', value: `₹${(summary.Expense || 0).toLocaleString()}`, color: 'error.main' },
          { label: 'Net Balance', value: `₹${Math.abs(net).toLocaleString()}`, color: net >= 0 ? 'primary.main' : 'error.main' },
        ].map(card => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              <Typography variant="h6" fontWeight={800} color={card.color}>{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField select size="small" label="Type" value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }} sx={{ width: 120 }}>
          <MenuItem value="">All</MenuItem>
          {['Income','Expense'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
        <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>Add Day Book Entry</DialogTitle>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <TextField label="Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                value={formValues.date} onChange={set('date')} />
              <TextField select label="Type" size="small" fullWidth required value={formValues.type} onChange={set('type')}>
                {['Income','Expense'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Description" multiline rows={2} size="small" fullWidth required
                value={formValues.description} onChange={set('description')} />
              <TextField label="Amount (₹)" type="number" size="small" fullWidth required
                value={formValues.amount} onChange={set('amount')} inputProps={{ min: 0 }} />
              <TextField label="Category" size="small" fullWidth value={formValues.category}
                onChange={set('category')} placeholder="e.g. Fee, Purchase, Salary" />
              <TextField select label="Payment Mode" size="small" fullWidth value={formValues.paymentMode} onChange={set('paymentMode')}>
                {['Cash','Cheque','Online','Card','UPI'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Entry</Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
