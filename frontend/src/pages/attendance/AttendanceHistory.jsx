import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, MenuItem, Chip, Button
} from '@mui/material';
import { IconRefresh, IconBrandWhatsapp } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

export default function AttendanceHistory() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filterDate) params.date = filterDate;
      if (filterType) params.type = filterType;
      const res = await api.get('/attendance', { params });
      setData(res.data);
      setTotal(res.pagination.total);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterDate, filterType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    {
      key: 'student',
      label: 'Student',
      render: (val) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {val?.firstName} {val?.lastName}
          </Typography>
          <Typography variant="caption" color="primary">{val?.studentId}</Typography>
        </Box>
      )
    },
    {
      key: 'student',
      label: 'Class',
      render: (val) => (
        <Typography variant="body2">
          {val?.class} - {val?.section}
        </Typography>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <Chip
          label={val === 'IN' ? 'ENTERED' : 'LEFT'}
          color={val === 'IN' ? 'success' : 'warning'}
          size="small"
          sx={{ fontWeight: 700, fontSize: '11px' }}
        />
      )
    },
    {
      key: 'timestamp',
      label: 'Time',
      render: (val) => (
        <Typography variant="body2">
          {new Date(val).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </Typography>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => <Typography variant="body2">{val}</Typography>
    },
    {
      key: 'whatsappSent',
      label: 'WhatsApp',
      render: (val) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconBrandWhatsapp size={16} color={val ? '#25D366' : '#94a3b8'} />
          <Typography variant="caption" color={val ? 'success.main' : 'text.disabled'}>
            {val ? 'Sent' : 'Not sent'}
          </Typography>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <PageHeader
        title="Attendance History"
        subtitle="View all IN / OUT attendance records"
        action={
          <Button variant="outlined" startIcon={<IconRefresh size={16} />} onClick={fetchData} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          type="date" label="Date" size="small"
          value={filterDate}
          onChange={(e) => { setFilterDate(e.target.value); setPage(1); }}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160 }}
        />
        <TextField
          select label="Type" size="small" value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="IN">Entered (IN)</MenuItem>
          <MenuItem value="OUT">Left (OUT)</MenuItem>
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        total={total}
        page={page}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(l) => { setLimit(l); setPage(1); }}
      />
    </Box>
  );
}
