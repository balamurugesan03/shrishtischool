import { useState, useEffect, useCallback } from 'react';
import { Button, IconButton, Tooltip, Avatar, Box, Typography, TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { staffAPI } from '../../services/api';

const DEPARTMENTS = ['Administration','Teaching','Science','Mathematics','Arts','Sports','IT','Library','Accounts'];

export default function StaffList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const res = await staffAPI.getAll({ page, limit, search, department: filterDept, status: filterStatus });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterDept, filterStatus]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await staffAPI.delete(deleteId);
      enqueueSnackbar('Staff member deleted', { variant: 'success' });
      setConfirmOpen(false);
      fetchStaff();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'staffId', label: 'Staff ID', render: v => <Typography variant="body2" fontWeight={500} color="primary">{v}</Typography> },
    {
      key: 'firstName', label: 'Name',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'secondary.main' }}>{row.firstName?.[0]}</Avatar>
          <Typography variant="body2">{row.firstName} {row.lastName}</Typography>
        </Box>
      )
    },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'phone', label: 'Phone' },
    { key: 'salary', label: 'Salary', render: v => `₹${v?.toLocaleString()}` },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="success" onClick={() => navigate(`/staff/edit/${row._id}`)}>
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
        title="Staff" subtitle="Manage school staff"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => navigate('/staff/add')}>Add Staff</Button>}
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField select size="small" label="Filter by Department" value={filterDept}
          onChange={e => { setFilterDept(e.target.value); setPage(1); }} sx={{ width: 200 }}>
          <MenuItem value="">All Departments</MenuItem>
          {DEPARTMENTS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
        </TextField>
        <TextField select size="small" label="Filter by Status" value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }} sx={{ width: 160 }}>
          <MenuItem value="">All Statuses</MenuItem>
          {['Active','Inactive','On Leave','Terminated'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }}
        onSearch={s => { setSearch(s); setPage(1); }} searchPlaceholder="Search staff..." />

      <ConfirmModal opened={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        loading={deleteLoading} title="Delete Staff Member" />
    </>
  );
}
