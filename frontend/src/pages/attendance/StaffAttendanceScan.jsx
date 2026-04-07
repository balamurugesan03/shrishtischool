import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Divider, Alert, CircularProgress, TextField, MenuItem
} from '@mui/material';
import {
  IconScan, IconBrandWhatsapp, IconClock, IconId, IconUserCheck
} from '@tabler/icons-react';
import { Html5Qrcode } from 'html5-qrcode';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import api from '../../services/api';

export default function StaffAttendanceScan() {
  const { enqueueSnackbar } = useSnackbar();
  const qrRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [cameraError, setCameraError] = useState(null);
  const processingRef = useRef(false);

  // Manual entry
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [manualProcessing, setManualProcessing] = useState(false);

  // Fetch all active staff for dropdown
  useEffect(() => {
    api.get('/staff', { params: { status: 'Active', limit: 500 } })
      .then(res => setStaffList(res.data || []))
      .catch(() => {});
  }, []);

  const stopScanner = useCallback(async () => {
    if (qrRef.current) {
      try { await qrRef.current.stop(); } catch (_) {}
      qrRef.current = null;
    }
    setScanning(false);
  }, []);

  const processAttendance = useCallback(async (staffMongoId) => {
    try {
      const res = await api.post('/staff-attendance/scan', { staffId: `STAFF:${staffMongoId}` });
      const result = {
        type: res.data.type,
        staff: res.data.staff,
        whatsappSent: res.data.whatsappSent,
        whatsappError: res.data.whatsappError,
        timestamp: new Date()
      };
      setLastResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 19)]);
      return result;
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
      return null;
    }
  }, [enqueueSnackbar]);

  const handleScanResult = useCallback(async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      const res = await api.post('/staff-attendance/scan', { staffId: decodedText });
      const result = {
        type: res.data.type,
        staff: res.data.staff,
        whatsappSent: res.data.whatsappSent,
        whatsappError: res.data.whatsappError,
        timestamp: new Date()
      };
      setLastResult(result);
      setRecentScans(prev => [result, ...prev.slice(0, 19)]);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || err.message, { variant: 'error' });
    } finally {
      setProcessing(false);
      setTimeout(() => { processingRef.current = false; }, 3000);
    }
  }, [enqueueSnackbar]);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setScanning(true);

    try {
      const qr = new Html5Qrcode('staff-qr-reader');
      qrRef.current = qr;

      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        handleScanResult,
        () => {}
      );
    } catch (err) {
      setCameraError('Camera not accessible. Please allow camera permission and try again.');
      setScanning(false);
      qrRef.current = null;
    }
  }, [handleScanResult]);

  const handleManualAttendance = async () => {
    if (!selectedStaffId) return;
    setManualProcessing(true);
    await processAttendance(selectedStaffId);
    setManualProcessing(false);
    setSelectedStaffId('');
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, [stopScanner]);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <Box>
      <PageHeader
        title="Staff Attendance Scanner"
        subtitle="Scan staff QR codes or select manually to mark IN / OUT attendance"
      />

      <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

        {/* Left panel: scanner + manual */}
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 380 } }}>

          {/* QR Camera Scanner */}
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconScan size={18} /> Camera Scanner
              </Typography>

              <Box
                id="staff-qr-reader"
                sx={{
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: scanning ? 'block' : 'none',
                  '& video': { borderRadius: 2, width: '100% !important' },
                  '& #staff-qr-reader__dashboard_section_csr button': { display: 'none' },
                  '& #staff-qr-reader__header_message': { display: 'none' },
                  '& #staff-qr-reader__status_span': { display: 'none' },
                }}
              />

              {!scanning && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  minHeight: 200, flexDirection: 'column', gap: 1
                }}>
                  <IconId size={40} color="#94a3b8" />
                  <Typography variant="body2" color="text.secondary">
                    Click Start to open camera
                  </Typography>
                </Box>
              )}

              {cameraError && (
                <Alert severity="error" sx={{ mt: 1, fontSize: '12px' }}>{cameraError}</Alert>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {!scanning ? (
                  <Button
                    fullWidth variant="contained" size="large"
                    startIcon={<IconScan size={18} />}
                    onClick={startScanner}
                  >
                    Start Scanning
                  </Button>
                ) : (
                  <Button
                    fullWidth variant="outlined" color="error" size="large"
                    onClick={stopScanner}
                  >
                    Stop Camera
                  </Button>
                )}
              </Box>

              {processing && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5, justifyContent: 'center' }}>
                  <CircularProgress size={16} />
                  <Typography variant="caption" color="text.secondary">Processing...</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Manual Staff Selection */}
          <Card variant="outlined" sx={{ borderRadius: 3, mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconUserCheck size={18} /> Manual Attendance
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                Select a staff member to mark attendance without QR
              </Typography>

              <TextField
                select
                fullWidth
                size="small"
                label="Select Staff"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="">-- Choose Staff --</MenuItem>
                {staffList.map(s => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} — {s.staffId} ({s.department})
                  </MenuItem>
                ))}
              </TextField>

              <Button
                fullWidth
                variant="contained"
                color="secondary"
                disabled={!selectedStaffId || manualProcessing}
                onClick={handleManualAttendance}
                startIcon={manualProcessing ? <CircularProgress size={16} color="inherit" /> : <IconUserCheck size={18} />}
              >
                {manualProcessing ? 'Marking...' : 'Mark Attendance'}
              </Button>
            </CardContent>
          </Card>

          {/* Last scan result */}
          {lastResult && (
            <Card
              variant="outlined"
              sx={{
                mt: 2, borderRadius: 3,
                borderColor: lastResult.type === 'IN' ? 'success.main' : 'warning.main',
                borderWidth: 2
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip
                    label={lastResult.type === 'IN' ? 'CHECKED IN' : 'CHECKED OUT'}
                    color={lastResult.type === 'IN' ? 'success' : 'warning'}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(lastResult.timestamp)}
                  </Typography>
                </Box>

                <Typography variant="h6" fontWeight={700}>
                  {lastResult.staff.firstName} {lastResult.staff.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lastResult.staff.staffId} &bull; {lastResult.staff.department}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lastResult.staff.role}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconBrandWhatsapp size={16} color={lastResult.whatsappSent ? '#25D366' : '#94a3b8'} />
                  <Typography variant="caption" color={lastResult.whatsappSent ? 'success.main' : 'text.secondary'}>
                    {lastResult.whatsappSent
                      ? 'WhatsApp notification sent'
                      : lastResult.whatsappError
                        ? `Failed: ${lastResult.whatsappError}`
                        : 'No phone number on record'
                    }
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Recent scans log */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={1} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconClock size={18} /> Today&apos;s Staff Scan Log
              </Typography>

              {recentScans.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <IconId size={40} color="#94a3b8" />
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    No scans yet. Start scanning to see the log.
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding>
                  {recentScans.map((scan, i) => (
                    <Box key={i}>
                      {i > 0 && <Divider />}
                      <ListItem disableGutters sx={{ py: 1 }}>
                        <ListItemAvatar sx={{ minWidth: 40 }}>
                          <Avatar
                            sx={{
                              width: 32, height: 32,
                              bgcolor: scan.type === 'IN' ? 'success.light' : 'warning.light',
                              color: scan.type === 'IN' ? 'success.dark' : 'warning.dark',
                              fontSize: '11px', fontWeight: 800
                            }}
                          >
                            {scan.type}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600}>
                              {scan.staff.firstName} {scan.staff.lastName}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {scan.staff.staffId} &bull; {scan.staff.department} &bull; {formatTime(scan.timestamp)}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                          <IconBrandWhatsapp size={14} color={scan.whatsappSent ? '#25D366' : '#94a3b8'} />
                        </Box>
                      </ListItem>
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
