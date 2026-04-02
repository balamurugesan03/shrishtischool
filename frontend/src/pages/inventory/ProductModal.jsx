import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Stack,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { productAPI } from '../../services/api';

const INIT = {
  name: '', description: '', category: '', price: 0, costPrice: 0,
  currentStock: 0, minimumStock: 5, unit: 'Piece', status: 'Active'
};

export default function ProductModal({ opened, onClose, editItem, categories, onSuccess }) {
  const { enqueueSnackbar } = useSnackbar();
  const [values, setValues] = useState(INIT);

  useEffect(() => {
    if (editItem) {
      setValues({
        name: editItem.name || '',
        description: editItem.description || '',
        category: editItem.category?._id || editItem.category || '',
        price: editItem.price || 0,
        costPrice: editItem.costPrice || 0,
        currentStock: editItem.currentStock || 0,
        minimumStock: editItem.minimumStock || 5,
        unit: editItem.unit || 'Piece',
        status: editItem.status || 'Active'
      });
    } else {
      setValues(INIT);
    }
  }, [editItem, opened]);

  const set = (field) => (e) => setValues(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await productAPI.update(editItem._id, values);
        enqueueSnackbar('Product updated', { variant: 'success' });
      } else {
        await productAPI.create(values);
        enqueueSnackbar('Product created', { variant: 'success' });
      }
      onSuccess();
    } catch (err) {
      enqueueSnackbar(err.message, { variant: 'error' });
    }
  };

  return (
    <Dialog open={!!opened} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle fontWeight={700}>{editItem ? 'Edit Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} pt={1}>
            <Grid item xs={12} sm={6}>
              <TextField label="Product Name" size="small" fullWidth required value={values.name} onChange={set('name')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Category" size="small" fullWidth required value={values.category} onChange={set('category')}>
                <MenuItem value="">Select category</MenuItem>
                {categories.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Sale Price (₹)" type="number" size="small" fullWidth value={values.price} onChange={set('price')} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Cost Price (₹)" type="number" size="small" fullWidth value={values.costPrice} onChange={set('costPrice')} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Current Stock" type="number" size="small" fullWidth value={values.currentStock} onChange={set('currentStock')} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Minimum Stock" type="number" size="small" fullWidth value={values.minimumStock} onChange={set('minimumStock')} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Unit" size="small" fullWidth value={values.unit} onChange={set('unit')} placeholder="Piece, Kg, etc." />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Status" size="small" fullWidth value={values.status} onChange={set('status')}>
                {['Active','Inactive'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" multiline rows={2} size="small" fullWidth value={values.description} onChange={set('description')} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">{editItem ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
