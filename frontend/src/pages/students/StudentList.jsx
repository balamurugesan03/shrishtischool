import { useState, useEffect, useCallback } from 'react';
import { Button, IconButton, Tooltip, Avatar, Box, Typography, TextField, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { studentAPI } from '../../services/api';

export default function StudentList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await studentAPI.getAll({ page, limit, search, class: filterClass, status: filterStatus });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterClass, filterStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await studentAPI.delete(deleteId);
      enqueueSnackbar('Student deleted', { variant: 'success' });
      setConfirmOpen(false);
      fetchStudents();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'studentId', label: 'Student ID',
      render: (val) => <Typography variant="body2" fontWeight={500} color="primary">{val}</Typography>
    },
    {
      key: 'firstName', label: 'Name',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>{row.firstName?.[0]}</Avatar>
          <Typography variant="body2">{row.firstName} {row.lastName}</Typography>
        </Box>
      )
    },
    { key: 'class', label: 'Class' },
    { key: 'section', label: 'Section' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status', label: 'Status',
      render: (val) => <StatusBadge status={val} />
    },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Profile">
            <IconButton size="small" color="primary" onClick={() => navigate(`/students/${row._id}`)}>
              <IconEye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="success" onClick={() => navigate(`/students/edit/${row._id}`)}>
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
        title="Students"
        subtitle="Manage all student records"
        action={
          <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => navigate('/students/add')}>
            Add Student
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select size="small" label="Filter by Class"
          value={filterClass} onChange={e => { setFilterClass(e.target.value); setPage(1); }}
          sx={{ width: 150 }}
        >
          <MenuItem value="">All Classes</MenuItem>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map(c => (
            <MenuItem key={c} value={c}>Class {c}</MenuItem>
          ))}
        </TextField>
        <TextField
          select size="small" label="Filter by Status"
          value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          sx={{ width: 160 }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          {['Active','Inactive','Transferred','Graduated'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable
        columns={columns} data={data} loading={loading} total={total}
        page={page} limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
        onSearch={(s) => { setSearch(s); setPage(1); }}
        searchPlaceholder="Search students..."
      />

      <ConfirmModal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Student"
        message="Are you sure you want to delete this student? All related data will also be affected."
      />
    </>
  );
}
