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

  return (
    <>
      <PageHeader title="Categories" subtitle="Manage product categories"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>Add Category</Button>} />

      <DataTable columns={columns} data={data} loading={loading} total={data.length} page={1} limit={data.length || 1} />

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
