import { useState, useEffect } from 'react';
import {
  Grid, Box, Typography, Card, CardContent, Chip, Alert,
} from '@mui/material';
import { IconPackage, IconAlertTriangle, IconTrendingDown } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { productAPI } from '../../services/api';

export default function StockReport() {
  const { enqueueSnackbar } = useSnackbar();
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productAPI.getAll({ limit: 1000, status: 'Active' }),
      productAPI.getLowStock()
    ]).then(([pRes, lsRes]) => {
      const prods = pRes.data;
      setProducts(prods);
      setLowStock(lsRes.data);
      setStats({
        total: prods.length,
        lowStock: prods.filter(p => p.currentStock <= p.minimumStock && p.currentStock > 0).length,
        outOfStock: prods.filter(p => p.currentStock === 0).length,
        totalValue: prods.reduce((sum, p) => sum + p.price * p.currentStock, 0)
      });
    }).catch(e => enqueueSnackbar(e.message, { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'productCode', label: 'Code', render: v => <Typography variant="body2" fontWeight={500} color="primary">{v}</Typography> },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category', render: v => v?.name },
    {
      key: 'currentStock', label: 'Current Stock',
      render: (v, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" fontWeight={600} color={v === 0 ? 'error.main' : v <= row.minimumStock ? 'warning.main' : 'success.main'}>{v}</Typography>
          {v === 0 && <Chip label="Out of Stock" color="error" size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 600 }} />}
          {v > 0 && v <= row.minimumStock && <Chip label="Low Stock" color="warning" size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 600 }} />}
        </Box>
      )
    },
    { key: 'minimumStock', label: 'Min Stock' },
    { key: 'unit', label: 'Unit' },
    { key: 'price', label: 'Price', render: v => `₹${v?.toLocaleString()}` },
    { key: 'currentStock', label: 'Stock Value', render: (v, row) => `₹${(v * row.price).toLocaleString()}` },
  ];

  const summaryCards = [
    { label: 'Total Products', value: stats.total, icon: <IconPackage size={24} />, color: 'primary.main', bgColor: 'rgba(99,102,241,0.1)' },
    { label: 'Low Stock Items', value: stats.lowStock, icon: <IconAlertTriangle size={24} />, color: 'warning.main', bgColor: 'rgba(245,158,11,0.1)' },
    { label: 'Out of Stock', value: stats.outOfStock, icon: <IconTrendingDown size={24} />, color: 'error.main', bgColor: 'rgba(239,68,68,0.1)' },
    { label: 'Total Stock Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: null, color: 'success.main', bgColor: 'rgba(16,185,129,0.1)' },
  ];

  return (
    <>
      <PageHeader title="Stock Report" subtitle="Current inventory stock levels" />

      <Grid container spacing={2} mb={3}>
        {summaryCards.map(card => (
          <Grid item xs={12} sm={6} lg={3} key={card.label}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                    <Typography variant="h5" fontWeight={700} color={card.color}>{card.value}</Typography>
                  </Box>
                  {card.icon && (
                    <Box sx={{ width: 48, height: 48, bgcolor: card.bgColor, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                      {card.icon}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {lowStock.length > 0 && (
        <Alert severity="warning" icon={<IconAlertTriangle size={16} />} sx={{ mb: 2, borderRadius: 1.5 }}>
          <strong>Low Stock Alert:</strong> {lowStock.length} product(s) are running low on stock and need to be restocked.
        </Alert>
      )}

      <DataTable columns={columns} data={products} loading={loading} total={products.length} page={1} limit={products.length || 1} />
    </>
  );
}
