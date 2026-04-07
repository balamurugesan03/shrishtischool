import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, MenuItem, Chip } from '@mui/material';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { paymentAPI } from '../../services/api';

export default function Payments() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getAll({ page, limit, type: filterType, startDate: startDate || undefined, endDate: endDate || undefined });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterType, startDate, endDate]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const columns = [
    { key: 'receiptNumber', label: 'Receipt #', render: (v, row) => (
      <Typography variant="body2" fontWeight={600} color={v ? 'success.main' : 'text.disabled'}>
        {v || row.paymentNumber}
      </Typography>
    )},
    { key: 'date', label: 'Date', render: v => new Date(v).toLocaleDateString() },
    { key: 'type', label: 'Type', render: v => <Chip label={v} size="small" color={v === 'Receipt' ? 'success' : 'error'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /> },
    { key: 'student', label: 'Student', render: v => v ? `${v.firstName} ${v.lastName}` : '-' },
    { key: 'description', label: 'Description' },
    { key: 'paymentMode', label: 'Mode' },
    { key: 'amount', label: 'Amount', render: (v, row) => <Typography variant="body2" fontWeight={600} color={row.type === 'Receipt' ? 'success.main' : 'error.main'}>₹{v?.toLocaleString()}</Typography> },
    { key: 'status', label: 'Status', render: v => <Chip label={v} size="small" color={v === 'Completed' ? 'success' : 'default'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /> }
  ];

  return (
    <>
      <PageHeader title="Payments & Receipts" subtitle="All payment transactions" />

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
