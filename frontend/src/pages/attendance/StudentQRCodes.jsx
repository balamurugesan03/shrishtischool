import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField,
  MenuItem, CircularProgress, Avatar, Divider, Tooltip, IconButton
} from '@mui/material';
import { IconPrinter, IconQrcode, IconRefresh, IconDownload } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

export default function StudentQRCodes() {
  const { enqueueSnackbar } = useSnackbar();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const printRef = useRef();

  const fetchQRs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterClass) params.class = filterClass;
      if (filterSection) params.section = filterSection;
      const res = await api.get('/attendance/qr', { params });
      setStudents(res.data);
    } catch (e) {
      enqueueSnackbar(e.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterSection]);

  useEffect(() => { fetchQRs(); }, [fetchQRs]);

  const handlePrintAll = () => {
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Student QR Codes</title>
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

  const handleDownloadOne = (student) => {
    const link = document.createElement('a');
    link.href = student.qr;
    link.download = `QR_${student.studentId}_${student.firstName}_${student.lastName}.png`;
    link.click();
  };

  return (
    <Box>
      <PageHeader
        title="Student QR Codes"
        subtitle="Generate and print QR cards for student attendance scanning"
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
              disabled={loading || students.length === 0}
            >
              Print All
            </Button>
          </Box>
        }
      />

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select label="Class" size="small" value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="">All Classes</MenuItem>
          {['1','2','3','4','5','6','7','8','9','10','11','12'].map(c => (
            <MenuItem key={c} value={c}>{`Class ${c}`}</MenuItem>
          ))}
        </TextField>
        <TextField
          select label="Section" size="small" value={filterSection}
          onChange={(e) => setFilterSection(e.target.value)}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All Sections</MenuItem>
          {['A','B','C','D','E'].map(s => (
            <MenuItem key={s} value={s}>Section {s}</MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : students.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <IconQrcode size={48} color="#94a3b8" />
          <Typography color="text.secondary" mt={1}>No active students found</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </Typography>

          {/* Printable area */}
          <div ref={printRef}>
            <div className="grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {students.map(s => (
                <div key={s._id} className="card" style={{
                  border: '1.5px solid #ddd', borderRadius: 8, padding: 12,
                  width: 160, textAlign: 'center', display: 'inline-block'
                }}>
                  <img src={s.qr} alt={`QR-${s.studentId}`} style={{ width: 130, height: 130 }} />
                  <div className="name" style={{ fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="sub" style={{ fontSize: 11, color: '#555' }}>{s.studentId}</div>
                  <div className="sub" style={{ fontSize: 11, color: '#555' }}>
                    Class {s.class} - {s.section}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive cards (screen view) */}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            {students.map(s => (
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
                    <Box component="img" src={s.qr} alt={s.studentId}
                      sx={{ width: 120, height: 120, display: 'block', mx: 'auto' }}
                    />
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {s.firstName} {s.lastName}
                    </Typography>
                    <Typography variant="caption" color="primary" display="block">{s.studentId}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Class {s.class} - {s.section}
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
