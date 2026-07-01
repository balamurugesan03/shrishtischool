import { useState, useEffect } from 'react';
import {
  Button, IconButton, Tooltip, Box, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, MenuItem,
} from '@mui/material';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import { categoryAPI } from '../../services/api';

const INIT = { name: '', description: '', status: 'Active' };

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'status', label: 'Status' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
];

function sortCategories(list, sortBy) {
  const sorted = [...list];
  switch (sortBy) {
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'status':
      return sorted.sort((a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name));
    case 'newest':
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'name_asc':
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function Categories() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState(INIT);
  const [sortBy, setSortBy] = useState('name_asc');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await categoryAPI.getAll();
      setData(res.data);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (editItem) setFormValues({ name: editItem.name, description: editItem.description || '', status: editItem.status });
    else setFormValues(INIT);
  }, [editItem, formOpen]);

  const set = (field) => (e) => setFormValues(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await categoryAPI.update(editItem._id, formValues);
        enqueueSnackbar('Category updated', { variant: 'success' });
      } else {
        await categoryAPI.create(formValues);
        enqueueSnackbar('Category created', { variant: 'success' });
      }
      setFormOpen(false); fetchData();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await categoryAPI.delete(deleteId);
      enqueueSnackbar('Category deleted', { variant: 'success' });
      setConfirmOpen(false); fetchData();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Category Name', render: v => <Typography variant="body2" fontWeight={500}>{v}</Typography> },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
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

  const sortedData = sortCategories(data, sortBy);

  return (
    <>
      <PageHeader title="Categories" subtitle="Manage product categories"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>Add Category</Button>} />

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          select size="small" label="Sort By"
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          sx={{ width: 180 }}
        >
          {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={sortedData} loading={loading} total={sortedData.length} page={1} limit={sortedData.length || 1} />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle fontWeight={700}>{editItem ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} pt={1}>
              <TextField label="Category Name" size="small" fullWidth required value={formValues.name} onChange={set('name')} />
              <TextField label="Description" multiline rows={2} size="small" fullWidth value={formValues.description} onChange={set('description')} />
              <TextField select label="Status" size="small" fullWidth value={formValues.status} onChange={set('status')}>
                {['Active','Inactive'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="text" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">{editItem ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <ConfirmModal opened={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        loading={deleteLoading} title="Delete Category" />
    </>
  );
}
