import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, CircularProgress, Divider, Tooltip, IconButton
} from '@mui/material';
import { IconPrinter, IconQrcode, IconRefresh, IconDownload } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

const DEPARTMENTS = [
  'Administration', 'Teaching', 'Science', 'Mathematics', 'English',
  'Social Studies', 'Physical Education', 'Arts', 'Library', 'Support Staff'
];

export default function StaffQRCodes() {
  const { enqueueSnackbar } = useSnackbar();
  const [staffList, setStaffList] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState('');
  const [filterStaffId, setFilterStaffId] = useState('');
  const printRef = useRef();

  const fetchQRs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDept) params.department = filterDept;
      const res = await api.get('/staff-attendance/qr', { params });
      setStaffList(res.data);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterDept]);

  // Fetch all active staff for the dropdown (unfiltered)
  useEffect(() => {
    api.get('/staff', { params: { status: 'Active', limit: 500 } })
      .then(res => setAllStaff(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchQRs(); }, [fetchQRs]);

  // Apply individual staff filter client-side
  const displayList = filterStaffId
    ? staffList.filter(s => s._id === filterStaffId)
    : staffList;

  const handlePrintAll = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Staff QR Codes</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
        .grid { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-start; }
        .card {
          border: 1.5px solid #ddd; border-radius: 8px; padding: 12px;
          width: 160px; text-align: center; break-inside: avoid;
          page-break-inside: avoid;
        }
        .card img { width: 130px; height: 130px; }
        .name { font-size: 13px; font-weight: 700; margin: 6px 0 2px; }
        .sub  { font-size: 11px; color: #555; margin: 1px 0; }
        @media print { body { padding: 0; } }
      </style></head>
      <body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownloadOne = (s) => {
    const link = document.createElement('a');
    link.href = s.qr;
    link.download = `QR_Staff_${s.staffId}_${s.firstName}_${s.lastName}.png`;
    link.click();
  };

  return (
    <Box>
      <PageHeader
        title="Staff QR Codes"
        subtitle="Generate and print QR cards for staff attendance scanning"
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<IconRefresh size={16} />}
              onClick={fetchQRs}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<IconPrinter size={16} />}
              onClick={handlePrintAll}
              disabled={loading || displayList.length === 0}
            >
              Print All
            </Button>
          </Box>
        }
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Individual staff dropdown */}
        <TextField
          select label="Staff Member" size="small" value={filterStaffId}
          onChange={(e) => setFilterStaffId(e.target.value)}
          sx={{ minWidth: 240 }}
        >
          <MenuItem value="">All Staff</MenuItem>
          {allStaff.map(s => (
            <MenuItem key={s._id} value={s._id}>
              {s.firstName} {s.lastName} ({s.staffId})
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select label="Department" size="small" value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setFilterStaffId(''); }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Departments</MenuItem>
          {DEPARTMENTS.map(d => (
            <MenuItem key={d} value={d}>{d}</MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : displayList.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <IconQrcode size={48} color="#94a3b8" />
          <Typography color="text.secondary" mt={1}>No active staff found</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {displayList.length} staff member{displayList.length !== 1 ? 's' : ''} found
          </Typography>

          {/* Printable area */}
          <div ref={printRef} style={{ display: 'none' }}>
            <div className="grid">
              {displayList.map(s => (
                <div key={s._id} className="card">
                  <img src={s.qr} alt={`QR-${s.staffId}`} style={{ width: 130, height: 130 }} />
                  <div className="name">{s.firstName} {s.lastName}</div>
                  <div className="sub">{s.staffId}</div>
                  <div className="sub">{s.department}</div>
                  <div className="sub">{s.designation || s.role}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive cards */}
          <Grid container spacing={2}>
            {displayList.map(s => (
              <Grid item key={s._id} xs={6} sm={4} md={3} lg={2}>
                <Card variant="outlined" sx={{ textAlign: 'center', borderRadius: 2, position: 'relative' }}>
                  <Tooltip title="Download QR">
                    <IconButton
                      size="small"
                      sx={{ position: 'absolute', top: 6, right: 6 }}
                      onClick={() => handleDownloadOne(s)}
                    >
                      <IconDownload size={14} />
                    </IconButton>
                  </Tooltip>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box component="img" src={s.qr} alt={s.staffId}
                      sx={{ width: 120, height: 120, display: 'block', mx: 'auto' }}
                    />
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {s.firstName} {s.lastName}
                    </Typography>
                    <Typography variant="caption" color="primary" display="block">{s.staffId}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap>
                      {s.department}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {s.designation || s.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
}
