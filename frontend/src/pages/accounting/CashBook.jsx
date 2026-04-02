import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, MenuItem, Grid, Paper, Chip } from '@mui/material';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { cashbookAPI } from '../../services/api';

export default function CashBook() {
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

  const fetchCashBook = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cashbookAPI.getAll({ page, limit, type: filterType, startDate: startDate || undefined, endDate: endDate || undefined });
      setData(res.data);
      setTotal(res.pagination.total);
      setSummary(res.summary || {});
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, startDate, endDate]);

  useEffect(() => { fetchCashBook(); }, [fetchCashBook]);

  const net = (summary.Receipt || 0) - (summary.Payment || 0);

  const columns = [
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString() },
    { key: 'voucherNumber', label: 'Voucher #' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type', render: v => <Chip label={v} size="small" color={v === 'Receipt' ? 'success' : 'error'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /> },
    { key: 'amount', label: 'Amount', render: (v, row) => <Typography variant="body2" fontWeight={500} color={row.type === 'Receipt' ? 'success.main' : 'error.main'}>₹{v?.toLocaleString()}</Typography> },
  ];

  return (
    <>
      <PageHeader title="Cash Book" subtitle="Cash receipts and payments" />

      <Grid container spacing={2} mb={2}>
        {[
          { label: 'Total Receipts', value: `₹${(summary.Receipt || 0).toLocaleString()}`, color: 'success.main' },
          { label: 'Total Payments', value: `₹${(summary.Payment || 0).toLocaleString()}`, color: 'error.main' },
          { label: 'Net Cash Balance', value: `₹${Math.abs(net).toLocaleString()}`, color: net >= 0 ? 'primary.main' : 'error.main' },
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
          onChange={e => { setFilterType(e.target.value); setPage(1); }} sx={{ width: 140 }}>
          <MenuItem value="">All</MenuItem>
          {['Receipt','Payment'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
        <TextField label="From Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }} />
        <TextField label="To Date" type="date" size="small" InputLabelProps={{ shrink: true }}
          value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }} />
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />
    </>
  );
}
