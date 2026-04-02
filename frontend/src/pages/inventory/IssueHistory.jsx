import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, MenuItem, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, Stack, Card, CardContent, Grid, Divider,
} from '@mui/material';
import { IconEye, IconReceipt, IconCash, IconDeviceMobile, IconPackage, IconUser, IconCalendar } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { inventoryAPI } from '../../services/api';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const statusColor = { Paid: 'success', Partial: 'warning', Pending: 'error' };

export default function IssueHistory() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.getAll({ page, limit, search, ...(filterStatus ? { paymentStatus: filterStatus } : {}) });
      setData(res.data || res);
      setTotal(res.pagination?.total || (res.data || res).length);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { key: 'createdAt', label: 'Date', render: v => <Typography variant="body2" color="text.secondary">{v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</Typography> },
    {
      key: 'student', label: 'Student',
      render: v => <Box><Typography variant="body2" fontWeight={600}>{v?.firstName} {v?.lastName}</Typography><Typography variant="caption" color="text.secondary">{v?.studentId} • {v?.class}-{v?.section}</Typography></Box>
    },
    { key: 'items', label: 'Items', render: v => <Typography variant="body2">{Array.isArray(v) ? v.map(i => `${i.product?.name || i.description} ×${i.quantity}`).join(', ') : '—'}</Typography> },
    { key: 'totalAmount', label: 'Total', render: v => <Typography variant="body2" fontWeight={600} color="primary">{fmt(v)}</Typography> },
    { key: 'paidAmount', label: 'Paid', render: v => <Typography variant="body2" fontWeight={600} color="success.main">{fmt(v)}</Typography> },
    { key: 'balance', label: 'Balance', render: v => <Typography variant="body2" fontWeight={600} color={v > 0 ? 'error.main' : 'success.main'}>{fmt(v)}</Typography> },
    { key: 'paymentStatus', label: 'Status', render: v => <Chip label={v || 'Pending'} size="small" color={statusColor[v] || 'default'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /> },
    { key: 'invoiceNumber', label: 'Invoice', render: v => v ? <Typography variant="body2" color="primary" fontWeight={500}>{v}</Typography> : <Typography variant="caption" color="text.secondary">—</Typography> },
    {
      key: '_id', label: '',
      render: (_, row) => (
        <Tooltip title="View Details" arrow>
          <IconButton size="small" color="primary" onClick={() => { setSelected(row); setDetailOpen(true); }}><IconEye size={16} /></IconButton>
        </Tooltip>
      )
    },
  ];

  return (
    <>
      <PageHeader title="Issue History" subtitle="All inventory issued to students"
        breadcrumbs={[{ label: 'Inventory' }, { label: 'Issue History' }]} />

      <Box sx={{ mb: 2 }}>
        <TextField select size="small" label="Filter by Payment Status" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }} sx={{ width: 200 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {['Paid','Partial','Pending'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }}
        onSearch={s => { setSearch(s); setPage(1); }} searchPlaceholder="Search by student name…" />

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconReceipt size={18} color="#fff" />
            </Box>
            <Typography fontWeight={700}>Issue Details</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selected && (
            <Stack spacing={2}>
              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, bgcolor: 'primary.light', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconUser size={13} color="#fff" /></Box>
                    <Typography variant="body2" fontWeight={700}>Student</Typography>
                  </Box>
                  <Grid container spacing={1}>
                    {[
                      ['Name', `${selected.student?.firstName} ${selected.student?.lastName}`],
                      ['Student ID', selected.student?.studentId],
                      ['Class', `${selected.student?.class}-${selected.student?.section}`],
                      ['Issued By', selected.issuedBy || '—'],
                    ].map(([label, value]) => (
                      <Grid item xs={6} key={label}>
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={500}>{value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, bgcolor: 'warning.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPackage size={13} color="#fff" /></Box>
                    <Typography variant="body2" fontWeight={700}>Items Issued</Typography>
                  </Box>
                  <Stack spacing={0.75}>
                    {(selected.items || []).map((item, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">{item.product?.name || item.description} × {item.quantity}</Typography>
                        <Typography variant="body2" fontWeight={500} color="primary">{fmt(item.totalPrice)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 1.5 }}>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <Box sx={{ width: 24, height: 24, bgcolor: 'success.main', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCash size={13} color="#fff" /></Box>
                    <Typography variant="body2" fontWeight={700}>Payment</Typography>
                    <Box ml="auto"><Chip label={selected.paymentStatus || 'Pending'} size="small" color={statusColor[selected.paymentStatus] || 'default'} variant="outlined" sx={{ height: 20, fontSize: '11px', fontWeight: 600 }} /></Box>
                  </Box>
                  <Stack spacing={0.75}>
                    {[
                      ['Total Amount', fmt(selected.totalAmount)],
                      ['Paid Amount', fmt(selected.paidAmount)],
                    ].map(([label, value]) => (
                      <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                        <Typography variant="body2" fontWeight={500}>{value}</Typography>
                      </Box>
                    ))}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" fontWeight={700}>Balance Due</Typography>
                      <Typography variant="body2" fontWeight={800} color={selected.balance > 0 ? 'error.main' : 'success.main'}>{fmt(selected.balance)}</Typography>
                    </Box>
                    {selected.invoiceNumber && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Invoice #</Typography>
                        <Typography variant="caption" color="primary" fontWeight={600}>{selected.invoiceNumber}</Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <IconCalendar size={13} color="gray" />
                <Typography variant="caption" color="text.secondary">
                  Issued on {selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN') : '—'}
                </Typography>
              </Box>
              {selected.notes && <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Note: {selected.notes}</Typography>}
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
