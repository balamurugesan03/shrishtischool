import { useState, useEffect, useCallback } from 'react';
import { Button, IconButton, Tooltip, Box, Typography, TextField, MenuItem, Chip } from '@mui/material';
import { IconPlus, IconEdit, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ConfirmModal from '../../components/ConfirmModal';
import ProductModal from './ProductModal';
import { productAPI, categoryAPI } from '../../services/api';

export default function ProductList() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    categoryAPI.getAll().then(res => {
      setCategories(res.data.map(c => ({ value: c._id, label: c.name })));
    });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll({ page, limit, search, category: filterCategory });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, filterCategory]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await productAPI.delete(deleteId);
      enqueueSnackbar('Product deleted', { variant: 'success' });
      setConfirmOpen(false); fetchProducts();
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    { key: 'productCode', label: 'Code', render: v => <Typography variant="body2" fontWeight={500} color="primary">{v}</Typography> },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category', render: v => v?.name || '-' },
    { key: 'price', label: 'Price', render: v => <Typography variant="body2" fontWeight={500}>₹{v?.toLocaleString()}</Typography> },
    {
      key: 'currentStock', label: 'Stock',
      render: (v, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2" fontWeight={500}>{v}</Typography>
          {row.isLowStock && <Tooltip title="Low Stock"><IconAlertTriangle size={14} color="orange" /></Tooltip>}
        </Box>
      )
    },
    { key: 'unit', label: 'Unit' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', label: 'Actions',
      render: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" color="success" onClick={() => { setEditItem(row); setFormOpen(true); }}>
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
      <PageHeader title="Products" subtitle="Manage inventory products"
        action={<Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => { setEditItem(null); setFormOpen(true); }}>Add Product</Button>} />

      <Box sx={{ mb: 2 }}>
        <TextField select size="small" label="Filter by Category" value={filterCategory}
          onChange={e => { setFilterCategory(e.target.value); setPage(1); }} sx={{ width: 200 }}>
          <MenuItem value="">All Categories</MenuItem>
          {categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
        </TextField>
      </Box>

      <DataTable columns={columns} data={data} loading={loading} total={total} page={page} limit={limit}
        onPageChange={setPage} onLimitChange={l => { setLimit(l); setPage(1); }}
        onSearch={s => { setSearch(s); setPage(1); }} searchPlaceholder="Search products..." />

      <ProductModal opened={formOpen} onClose={() => setFormOpen(false)} editItem={editItem}
        categories={categories} onSuccess={() => { setFormOpen(false); fetchProducts(); }} />

      <ConfirmModal opened={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete}
        loading={deleteLoading} title="Delete Product" message="Are you sure you want to delete this product?" />
    </>
  );
}
