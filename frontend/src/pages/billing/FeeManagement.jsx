import { useState, useEffect, useCallback } from 'react';
import {
  Button, IconButton, Tooltip, Box, Typography, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Paper, Grid, Chip,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconCurrencyRupee, IconBrandWhatsapp } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import api, { feeAPI, studentAPI } from '../../services/api';

const CLASS_LIST = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const SECTION_LIST = ['A','B','C','D','E'];
const FEE_TYPES = ['Tuition Fee','Library Fee','Lab Fee','Sports Fee','Transport Fee','Exam Fee','Miscellaneous'];

const FORM_INIT = { student: '', feeType: '', amount: 0, dueDate: new Date().toISOString().split('T')[0], academicYear: '2026-2027', term: '', notes: '' };
const COLLECT_INIT = { amount: 0, paymentMode: 'Cash', receiptNumber: '' };

export default function FeeManagement() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalAmount: 0, totalPaid: 0, totalBalance: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStudent, setFilterStudent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFeeType, setFilterFeeType] = useState('');
  const [allStudents, setAllStudents] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [collectFee, setCollectFee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [collectLoading, setCollectLoading] = useState(false);
  const [waSendingId, setWaSendingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [collectOpen, setCollectOpen] = useState(false);
  const [formValues, setFormValues] = useState(FORM_INIT);
  const [collectValues, setCollectValues] = useState(COLLECT_INIT);
  const [formClass, setFormClass] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formStudentOpts, setFormStudentOpts] = useState([]);

  useEffect(() => {
    studentAPI.getAll({ limit: 2000, status: 'Active' }).then(res => {
      setAllStudents(res.data);
      setStudentOptions(res.data.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName}` })));
    });
  }, []);

  useEffect(() => {
    let filtered = allStudents;
    if (filterClass)   filtered = filtered.filter(s => s.class === filterClass);
    if (filterSection) filtered = filtered.filter(s => s.section === filterSection);
    setStudentOptions(filtered.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName}` })));
    setFilterStudent('');
  }, [filterClass, filterSection, allStudents]);

  useEffect(() => {
    let filtered = allStudents;
    if (formClass)   filtered = filtered.filter(s => s.class === formClass);
    if (formSection) filtered = filtered.filter(s => s.section === formSection);
    setFormStudentOpts(filtered.map(s => ({ value: s._id, label: `${s.firstName} ${s.lastName} (${s.studentId})` })));
    setFormValues(prev => ({ ...prev, student: '' }));
  }, [formClass, formSection, allStudents]);

  const fetchFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getAll({ page, limit, class: filterClass, section: filterSection, student: filterStudent, status: filterStatus, feeType: filterFeeType });
      setData(res.data);
      setTotal(res.pagination.total);
      setSummary(res.summary || { totalAmount: 0, totalPaid: 0, totalBalance: 0, count: 0 });
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterClass, filterSection, filterStudent, filterStatus, filterFeeType]);

  useEffect(() => { fetchFees(); }, [fetchFees]);

  useEffect(() => {
    if (editItem) {
      const s = allStudents.find(st => st._id === (editItem.student?._id || editItem.student));
      setFormClass(s?.class || '');
      setFormSection(s?.section || '');
      setFormValues({ ...editItem, dueDate: editItem.dueDate ? editItem.dueDate.split('T')[0] : '', student: editItem.student?._id || editItem.student });
    } else {
      setFormClass(''); setFormSection('');
      setFormValues(FORM_INIT);
    }
  }, [editItem, formOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await feeAPI.update(editItem._id, formValues);
        enqueueSnackbar('Fee updated', { variant: 'success' });
      } else {
        await feeAPI.create(formValues);
        enqueueSnackbar('Fee created successfully', { variant: 'success' });
      }
      setFormOpen(false); fetchFees();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await feeAPI.delete(deleteId);
      enqueueSnackbar('Fee deleted', { variant: 'success' });
      setConfirmOpen(false); fetchFees();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCollect = async (e) => {
    e.preventDefault();
    setCollectLoading(true);
    try {
      await feeAPI.collect(collectFee._id, collectValues);
      enqueueSnackbar('Payment collected!', { variant: 'success' });
      setCollectOpen(false); fetchFees();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setCollectLoading(false);
    }
  };

  const handleSendWhatsApp = async (row) => {
    if (!row.student?.phone) { enqueueSnackbar('Student phone number not available', { variant: 'warning' }); return; }
    setWaSendingId(row._id);
    try {
      await feeAPI.sendWhatsApp(row._id);
      enqueueSnackbar(`Fee receipt PDF sent to ${row.student.phone} via WhatsApp`, { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    } finally {
      setWaSendingId(null);
    }
  };

  const set = (field) => (e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }));
  const setCollect = (field) => (e) => setCollectValues(prev => ({ ...prev, [field]: e.target.value }));

  const columns = [
    { key: 'student', label: 'Student', render: v => <Typography variant="body2" fontWeight={500}>{v?.firstName} {v?.lastName}</Typography> },
    { key: 'feeType', label: 'Fee Type' },
    { key: 'amount', label: 'Amount', render: v => `₹${v?.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', render: v => <Typography variant="body2" color="success.main">₹{v?.toLocaleString()}</Typography> },
    { key: 'balance', label: 'Balance', render: v => <Typography variant="body2" color={v > 0 ? 'error.main' : 'success.main'}>₹{v?.toLocaleString()}</Typography> },
    { key: 'dueDate', label: 'Due Date', render: v => v ? new Date(v).toLocaleDateString() : '-' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {row.student?.phone && (
            <Tooltip title="Send Fee Receipt via WhatsApp">
              <IconButton size="small" onClick={() => handleSendWhatsApp(row)} disabled={waSendingId === row._id}
                sx={{ color: '#25D366', '&:hover': { bgcolor: '#25D36622' } }}>
                <IconBrandWhatsapp size={16} />
              </IconButton>
            </Tooltip>
          )}
          {row.balance > 0 && (
            <Tooltip title="Collect Payment">
              <IconButton size="small" color="success" onClick={async () => {
                  setCollectFee(row);
                  setCollectValues({ amount: row.balance, paymentMode: 'Cash', receiptNumber: '' });
                  setCollectOpen(true);
                  try {
                    const res = await api.get('/payments/next-receipt-number');
                    setCollectValues(prev => ({ ...prev, receiptNumber: res.data.receiptNumber }));
                  } catch (_) {}
                }}>
                <IconCurrencyRupee size={16} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton size="small" color="primary" onClick={() => { setEditItem(row); setFormOpen(true); }}>
              <IconEdit size={16} />
            </IconButton>
          </Tooltip>
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
        title="Fee Management" subtitle="Manage student fee records"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>Add Fee</Button>}
      />

      {/* Summary */}
      <Grid container spacing={2} mb={2}>
        {[
          { label: 'Total Fees', value: `₹${summary.totalAmount?.toLocaleString()}`, color: 'primary.main' },
          { label: 'Total Collected', value: `₹${summary.totalPaid?.toLocaleString()}`, color: 'success.main' },
          { label: 'Total Balance', value: `₹${summary.totalBalance?.toLocaleString()}`, color: 'error.main' },
          { label: 'Total Records', value: summary.count, color: 'text.primary' },
        ].map(card => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">{card.label}</Typography>
              <Typography variant="h6" fontWeight={800} color={card.color}>{card.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField select size="small" label="Class" value={filterClass}
          onChange={e => { setFilterClass(e.target.value); setPage(1); }} sx={{ width: 120 }}>
          <MenuItem value="">All</MenuItem>
          {CLASS_LIST.map(c => <MenuItem key={c} value={c}>Class {c}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Section" value={filterSection}
          onChange={e => { setFilterSection(e.target.value); setPage(1); }} sx={{ width: 110 }}>
          <MenuItem value="">All</MenuItem>
          {SECTION_LIST.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Student" value={filterStudent}
          onChange={e => { setFilterStudent(e.target.value); setPage(1); }} sx={{ width: 180 }}>
          <MenuItem value="">All Students</MenuItem>
          {studentOptions.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Status" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }} sx={{ width: 140 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {['Pending','Partial','Paid','Overdue'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Fee Type" value={filterFeeType}
          onChange={e => { setFilterFeeType(e.target.value); setPage(1); }} sx={{ width: 160 }}>
          <MenuItem value="">All Types</MenuItem>
          {FEE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }} />

      {/* Fee Form Modal */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>{editItem ? 'Edit Fee' : 'Add Fee'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField select size="small" label="Class" value={formClass}
                  onChange={e => setFormClass(e.target.value)} sx={{ width: 120 }}>
                  <MenuItem value="">All</MenuItem>
                  {CLASS_LIST.map(c => <MenuItem key={c} value={c}>Class {c}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="Section" value={formSection}
                  onChange={e => setFormSection(e.target.value)} sx={{ width: 110 }}>
                  <MenuItem value="">All</MenuItem>
                  {SECTION_LIST.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Box>
              <TextField select size="small" fullWidth label="Student" required value={formValues.student} onChange={set('student')}>
                <MenuItem value="">Select student</MenuItem>
                {formStudentOpts.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
              <TextField select size="small" fullWidth label="Fee Type" required value={formValues.feeType} onChange={set('feeType')}>
                <MenuItem value="">Select fee type</MenuItem>
                {FEE_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Amount (₹)" type="number" size="small" fullWidth required
                value={formValues.amount} onChange={set('amount')} inputProps={{ min: 0 }} />
              <TextField label="Due Date" type="date" size="small" fullWidth InputLabelProps={{ shrink: true }}
                value={formValues.dueDate} onChange={set('dueDate')} />
              <TextField label="Academic Year" size="small" fullWidth value={formValues.academicYear} onChange={set('academicYear')} />
              <TextField label="Term" size="small" fullWidth value={formValues.term} onChange={set('term')} placeholder="e.g. Q1, Term 1" />
              <TextField label="Notes" multiline rows={2} size="small" fullWidth value={formValues.notes} onChange={set('notes')} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Collect Payment Modal */}
      <Dialog open={collectOpen} onClose={() => setCollectOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleCollect}>
          <DialogTitle fontWeight={700}>Collect Fee Payment</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Balance: <strong>₹{collectFee?.balance?.toLocaleString()}</strong>
            </Typography>
            <Stack spacing={2} pt={0.5}>
              <TextField label="Amount (₹)" type="number" size="small" fullWidth required
                value={collectValues.amount}
                onChange={setCollect('amount')} inputProps={{ min: 1, max: collectFee?.balance }} />
              <TextField select label="Payment Mode" size="small" fullWidth
                value={collectValues.paymentMode} onChange={setCollect('paymentMode')}>
                {['Cash','Cheque','Online','Card','UPI'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <TextField label="Receipt Number" size="small" fullWidth
                value={collectValues.receiptNumber} onChange={setCollect('receiptNumber')}
                helperText="Auto-generated — you can edit if needed"
                InputProps={{ sx: { fontWeight: 600 } }} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setCollectOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={collectLoading}>
              {collectLoading ? 'Saving...' : 'Collect Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmModal opened={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        loading={deleteLoading} title="Delete Fee" />
    </>
  );
}
